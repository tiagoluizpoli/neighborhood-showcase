#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly DEFAULT_PLAN_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly PLAN_DIR="${PLAN_DIR_OVERRIDE:-${DEFAULT_PLAN_DIR}}"

python3 - "$PLAN_DIR" "$@" <<'PY'
import argparse
import json
import re
import sys
from pathlib import Path


def parse_args(argv):
    parser = argparse.ArgumentParser(
        prog="retrieve-history.sh",
        description="Return a ranked local Ralph Loop history bundle.",
    )
    parser.add_argument("--task-id", default="")
    parser.add_argument("--epic-id", default="")
    parser.add_argument("--prd-id", default="")
    parser.add_argument("--file", dest="file_path", default="")
    parser.add_argument("--query", default="")
    parser.add_argument("--limit", type=int, default=10)
    return parser.parse_args(argv)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def tokenize(query: str) -> list[str]:
    return [token for token in re.split(r"[^a-z0-9]+", query.lower()) if token]


def score_text(text: str, args, tokens: list[str]) -> tuple[int, list[str]]:
    lowered = text.lower()
    score = 0
    reasons: list[str] = []

    if args.prd_id:
        if args.prd_id == text or args.prd_id in text:
            score += 120
            reasons.append(f"prd={args.prd_id}")
    if args.epic_id:
        if args.epic_id == text or args.epic_id in text:
            score += 90
            reasons.append(f"epic={args.epic_id}")
    if args.task_id:
        if args.task_id == text or args.task_id in text:
            score += 80
            reasons.append(f"task={args.task_id}")
    if args.file_path:
        file_lower = args.file_path.lower()
        if file_lower in lowered:
            score += 60
            reasons.append("file")
    if args.query:
        query_lower = args.query.lower()
        occurrences = lowered.count(query_lower)
        if occurrences:
            score += 35 + min(occurrences, 5) * 5
            reasons.append("phrase")
        token_hits = 0
        for token in tokens:
            if token in lowered:
                token_hits += 1
        if token_hits:
            score += token_hits * 6
            reasons.append(f"tokens={token_hits}")

    return score, reasons


def summarize_lines(text: str, max_lines: int = 12) -> str:
    lines = [line.rstrip() for line in text.splitlines() if line.strip()]
    if not lines:
        return "(empty)"
    selected = lines[:max_lines]
    if len(lines) > max_lines:
        selected.append("...")
    return "\n".join(selected)


def build_event_hit(path: Path, event: dict, args, tokens: list[str]):
    event_text = json.dumps(event, ensure_ascii=False, sort_keys=True)
    score, reasons = score_text(event_text, args, tokens)
    if score == 0 and any([args.prd_id, args.epic_id, args.task_id, args.file_path, args.query]):
        return None
    summary = event.get("summary", "(no summary)")
    return {
        "score": score,
        "kind": "event",
        "source": str(path),
        "stamp": event.get("timestamp", ""),
        "title": f"{event.get('runId', 'unknown-run')} [{event.get('result', 'unknown')}]",
        "details": f"prd={event.get('prdId', '—')} epic={event.get('epicId', '—')} task={event.get('taskId', '—')} subTask={event.get('subTaskId', '—')}",
        "summary": summary,
        "reasons": reasons,
    }


def build_file_hit(path: Path, args, tokens: list[str], kind: str):
    text = read_text(path)
    score, reasons = score_text(text, args, tokens)
    if score == 0 and any([args.prd_id, args.epic_id, args.task_id, args.file_path, args.query]):
        return None
    return {
        "score": score,
        "kind": kind,
        "source": str(path),
        "stamp": "",
        "title": path.name,
        "details": f"path={path}",
        "summary": summarize_lines(text, max_lines=8),
        "reasons": reasons,
    }


def iter_history_hits(plan_dir: Path, args, tokens: list[str]):
    hits = []
    history_files = [plan_dir / ".run-history.jsonl"]
    history_files.extend(sorted((plan_dir / "archive").glob("*/run-history.jsonl")))

    for history_file in history_files:
        if not history_file.is_file():
            continue
        for line in history_file.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            event = json.loads(line)
            hit = build_event_hit(history_file, event, args, tokens)
            if hit:
                hits.append(hit)

    summary_candidates = [plan_dir / ".run-summary.md"]
    summary_candidates.extend(sorted((plan_dir / "summaries").glob("*.md")))
    summary_candidates.extend(sorted((plan_dir / "archive").glob("*/run-summary.md")))

    seen = set()
    for summary_file in summary_candidates:
        if not summary_file.is_file():
            continue
        resolved = str(summary_file.resolve())
        if resolved in seen:
            continue
        seen.add(resolved)
        hit = build_file_hit(summary_file, args, tokens, kind="summary")
        if hit:
            hits.append(hit)

    for manifest_file in sorted((plan_dir / "archive").glob("*/manifest.json")):
        if not manifest_file.is_file():
            continue
        hit = build_file_hit(manifest_file, args, tokens, kind="manifest")
        if hit:
            hits.append(hit)

    return hits


def print_bundle(plan_dir: Path, args) -> None:
    tokens = tokenize(args.query)
    hits = iter_history_hits(plan_dir, args, tokens)
    hits.sort(key=lambda item: (item["score"], item["stamp"], item["source"]), reverse=True)
    hits = hits[: max(args.limit, 1)]

    print("# Retrieval Bundle")
    print()
    print("## Inputs")
    print(f"- prd-id: {args.prd_id or '—'}")
    print(f"- epic-id: {args.epic_id or '—'}")
    print(f"- task-id: {args.task_id or '—'}")
    print(f"- file: {args.file_path or '—'}")
    print(f"- query: {args.query or '—'}")
    print(f"- limit: {args.limit}")
    print()
    print("## Active Summary Snapshot")
    summary_file = plan_dir / ".run-summary.md"
    if summary_file.is_file():
        print(summarize_lines(read_text(summary_file), max_lines=14))
    else:
        print("(missing active summary)")
    print()
    print("## Ranked Hits")
    if not hits:
        print("(no matching history hits)")
        return

    for index, hit in enumerate(hits, start=1):
        print(f"{index}. score={hit['score']} kind={hit['kind']} title={hit['title']}")
        print(f"   source: {hit['source']}")
        if hit["stamp"]:
            print(f"   timestamp: {hit['stamp']}")
        print(f"   details: {hit['details']}")
        if hit["reasons"]:
            print(f"   matched-on: {', '.join(hit['reasons'])}")
        for line in hit["summary"].splitlines():
            print(f"   {line}")
        print()

    print("## Compact Bundle")
    top = hits[0]
    print(f"- Best hit: {top['title']} ({top['source']})")
    if args.task_id:
        matching_tasks = [hit for hit in hits if args.task_id in hit['details'] or args.task_id in hit['summary']]
        print(f"- Hits mentioning {args.task_id}: {len(matching_tasks)}")
    if args.epic_id:
        matching_epics = [hit for hit in hits if args.epic_id in hit['details'] or args.epic_id in hit['summary']]
        print(f"- Hits mentioning {args.epic_id}: {len(matching_epics)}")
    if args.prd_id:
        matching_prds = [hit for hit in hits if args.prd_id in hit['details'] or args.prd_id in hit['summary']]
        print(f"- Hits mentioning {args.prd_id}: {len(matching_prds)}")
    print("- Sources:")
    for hit in hits[: min(5, len(hits))]:
        print(f"  - {hit['source']}")


def main():
    plan_dir = Path(sys.argv[1]).resolve()
    args = parse_args(sys.argv[2:])
    print_bundle(plan_dir, args)


if __name__ == "__main__":
    main()
PY
