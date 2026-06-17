#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly DEFAULT_PLAN_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly PLAN_DIR="${PLAN_DIR_OVERRIDE:-${DEFAULT_PLAN_DIR}}"

python3 - "$PLAN_DIR" "$@" <<'PY'
import argparse
import json
import re
import shlex
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


STATUS_VALUES = {"ready", "in-progress", "blocked", "done"}
BLOCK_REASONS = {"BLOCKED", "CLARIFICATION_NEEDED", "HISTORY_INSUFFICIENT"}


@dataclass
class SubTask:
    id: str
    title: str
    status: str
    model: str
    escalate_if: list[str]
    blocked_by: list[str]
    files_to_touch: list[str]


@dataclass
class TaskRecord:
    id: str
    epic_id: str
    title: str
    path: Path
    status: str
    default_model: str
    blocked_by: list[str]
    subtasks: list[SubTask]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="runtime-state.sh")
    subparsers = parser.add_subparsers(dest="command", required=True)

    prepare = subparsers.add_parser("prepare-attempt")
    prepare.add_argument("--runner", required=True)
    prepare.add_argument("--runner-model", default="unknown")
    prepare.add_argument("--format", choices=["shell", "json"], default="json")

    record = subparsers.add_parser("record-result")
    record.add_argument("--result", required=True, choices=["success", "retry", "blocked", "no-tasks"])
    record.add_argument("--runner-model", default="unknown")
    record.add_argument("--reason", default="")
    record.add_argument("--commit-changed", choices=["true", "false"], default="false")
    record.add_argument("--format", choices=["shell", "json"], default="json")

    return parser.parse_args(argv)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        raise SystemExit("Expected frontmatter block")
    end = text.find("\n---\n", 4)
    if end == -1:
        raise SystemExit("Unterminated frontmatter block")

    result: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if ": " not in line:
            continue
        key, value = line.split(": ", 1)
        result[key] = value
    return result


def set_frontmatter_value(text: str, key: str, value: str) -> str:
    lines = text.splitlines(keepends=True)
    target = f"{key}: "
    closing_index = None
    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            closing_index = index
            break
    if closing_index is None:
        raise SystemExit("Unterminated frontmatter block")

    for index in range(1, closing_index):
        if lines[index].startswith(target):
            lines[index] = f"{key}: {value}\n"
            return "".join(lines)

    lines.insert(closing_index, f"{key}: {value}\n")
    return "".join(lines)


def parse_list_value(raw: str | None) -> list[str]:
    if not raw or raw == "[]":
        return []
    value = raw.strip()
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [part.strip() for part in inner.split(",") if part.strip()]
    return [value]


def serialize_list_value(values: list[str]) -> str:
    if not values:
        return "[]"
    return "[" + ", ".join(values) + "]"


def parse_task_title(text: str) -> str:
    match = re.search(r"^## What to Build\n\n(.+)$", text, re.MULTILINE)
    if not match:
        return "Untitled task"
    return match.group(1).strip()


def normalize_model(raw_model: str) -> str:
    model = raw_model.strip().lower()
    aliases = {
        "low": "low",
        "medium": "medium",
        "mid": "medium",
        "high": "high",
    }
    return aliases.get(model, model or "medium")


def max_model(left: str, right: str) -> str:
    order = {"low": 0, "medium": 1, "high": 2}
    left_normalized = normalize_model(left)
    right_normalized = normalize_model(right)
    return left_normalized if order.get(left_normalized, 1) >= order.get(right_normalized, 1) else right_normalized


def parse_subtasks(text: str, default_model: str) -> list[SubTask]:
    lines = text.splitlines()
    subtasks: list[SubTask] = []
    current: dict[str, Any] | None = None
    current_field: str | None = None

    for line in lines:
        if line.startswith("### ST-"):
            if current:
                subtasks.append(
                    SubTask(
                        id=current["id"],
                        title=current["title"],
                        status=current.get("status", "ready"),
                        model=normalize_model(current.get("model", default_model)),
                        escalate_if=current.get("escalate_if", []),
                        blocked_by=current.get("blocked_by", []),
                        files_to_touch=current.get("files_to_touch", []),
                    )
                )
            match = re.match(r"^###\s+(ST-[^\s]+)\s+-\s+(.*)$", line)
            if not match:
                raise SystemExit(f"Could not parse sub-task header: {line}")
            current = {
                "id": match.group(1).strip(),
                "title": match.group(2).strip(),
                "status": "ready",
                "model": default_model,
                "escalate_if": [],
                "blocked_by": [],
                "files_to_touch": [],
            }
            current_field = None
            continue

        if current is None:
            continue

        if line.startswith("### ") and not line.startswith("### ST-"):
            break

        if line.startswith("status: "):
            value = line.split(": ", 1)[1].strip()
            if value not in STATUS_VALUES:
                raise SystemExit(f"Unknown sub-task status: {value}")
            current["status"] = value
            current_field = None
            continue

        if line.startswith("model: "):
            current["model"] = line.split(": ", 1)[1].strip()
            current_field = None
            continue

        if line.startswith("escalate-if: "):
            current["escalate_if"] = parse_list_value(line.split(": ", 1)[1].strip())
            current_field = None
            continue

        if line.startswith("blocked-by: "):
            current["blocked_by"] = parse_list_value(line.split(": ", 1)[1].strip())
            current_field = None
            continue

        if line.strip() == "files-to-touch:":
            current_field = "files_to_touch"
            continue

        if current_field == "files_to_touch":
            stripped = line.strip()
            if stripped.startswith("- "):
                current["files_to_touch"].append(stripped[2:].strip().strip("`"))
                continue
            if stripped:
                current_field = None

    if current:
        subtasks.append(
            SubTask(
                id=current["id"],
                title=current["title"],
                status=current.get("status", "ready"),
                model=normalize_model(current.get("model", default_model)),
                escalate_if=current.get("escalate_if", []),
                blocked_by=current.get("blocked_by", []),
                files_to_touch=current.get("files_to_touch", []),
            )
        )

    return subtasks


def load_tasks(plan_dir: Path) -> list[TaskRecord]:
    tasks: list[TaskRecord] = []
    for task_file in sorted((plan_dir / "epics").glob("*/tasks/*.md")):
        text = read_text(task_file)
        frontmatter = parse_frontmatter(text)
        default_model = normalize_model(frontmatter.get("default-model", "medium"))
        tasks.append(
            TaskRecord(
                id=frontmatter["id"],
                epic_id=frontmatter["epic"],
                title=parse_task_title(text),
                path=task_file,
                status=frontmatter.get("status", "ready"),
                default_model=default_model,
                blocked_by=parse_list_value(frontmatter.get("blocked-by")),
                subtasks=parse_subtasks(text, default_model),
            )
        )
    return tasks


def select_current_subtask(tasks: list[TaskRecord]) -> tuple[TaskRecord, SubTask] | None:
    for task in tasks:
        if task.status == "done":
            continue
        for subtask in task.subtasks:
            if subtask.status in {"ready", "in-progress"}:
                return task, subtask
    return None


def current_prd_id(plan_dir: Path) -> str | None:
    pointer = plan_dir / "prds" / ".current-prd"
    if not pointer.is_file():
        return None
    target = pointer.read_text(encoding="utf-8").strip()
    if not target:
        return None
    return Path(target).stem


def load_run_state(plan_dir: Path) -> dict[str, Any]:
    state_file = plan_dir / ".run-state.json"
    if state_file.is_file():
        return json.loads(read_text(state_file))
    return {
        "currentRunId": None,
        "currentPrdId": None,
        "currentEpicId": None,
        "currentTaskId": None,
        "currentSubTaskId": None,
        "attemptCount": 0,
        "retrievalRound": 0,
        "lastModel": None,
        "escalated": False,
        "lastFailureReason": None,
        "requiredModel": None,
        "runnerName": None,
        "escalateIf": [],
        "filesToTouch": [],
        "lastCommitChanged": False,
    }


def save_run_state(plan_dir: Path, state: dict[str, Any]) -> None:
    write_text(plan_dir / ".run-state.json", json.dumps(state, indent=2) + "\n")


def history_sources(plan_dir: Path) -> list[Path]:
    candidates = [
        plan_dir / ".run-history.jsonl",
        plan_dir / ".run-summary.md",
    ]
    candidates.extend(sorted((plan_dir / "summaries").glob("*.md")))
    candidates.extend(sorted((plan_dir / "archive").glob("*/run-history.jsonl")))
    candidates.extend(sorted((plan_dir / "archive").glob("*/run-summary.md")))
    candidates.extend(sorted((plan_dir / "archive").glob("*/manifest.json")))
    return [path for path in candidates if path.is_file()]


def task_touches_previously_worked_area(plan_dir: Path, task: TaskRecord, subtask: SubTask) -> bool:
    sources = history_sources(plan_dir)
    if not sources:
        return False

    search_terms = [task.id, task.epic_id]
    search_terms.extend(subtask.files_to_touch)

    for source in sources:
        text = read_text(source)
        if any(term and term in text for term in search_terms):
            return True

    return False


def make_run_id(task: TaskRecord, subtask: SubTask) -> str:
    return f"{task.epic_id.lower()}-{task.id.lower()}-{subtask.id.lower()}"


def emit(data: dict[str, Any], output_format: str) -> None:
    if output_format == "json":
        print(json.dumps(data, indent=2, sort_keys=True))
        return

    for key, value in data.items():
        shell_key = re.sub(r"[^A-Z0-9_]+", "_", key.upper())
        if isinstance(value, bool):
            rendered = "true" if value else "false"
        elif value is None:
            rendered = ""
        elif isinstance(value, list):
            rendered = ",".join(str(item) for item in value)
        else:
            rendered = str(value)
        print(f"{shell_key}={shlex.quote(rendered)}")


def set_subtask_field(text: str, subtask_id: str, field: str, value: str) -> str:
    lines = text.splitlines(keepends=True)
    in_target = False
    target_prefix = f"{field}: "

    for index, line in enumerate(lines):
        if line.startswith(f"### {subtask_id} "):
            in_target = True
            continue
        if in_target and line.startswith("### ST-"):
            break
        if in_target and line.startswith(target_prefix):
            lines[index] = f"{field}: {value}\n"
            return "".join(lines)

    raise SystemExit(f"Missing field '{field}' for sub-task {subtask_id}")


def sync_state(plan_dir: Path) -> None:
    result = subprocess.run(
        ["bash", str(plan_dir / "helper-scripts" / "sync-state.sh")],
        check=True,
        capture_output=True,
        text=True,
    )
    if result.stdout.strip():
        print(result.stdout.strip(), file=sys.stderr)
    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)


def prepare_attempt(plan_dir: Path, runner: str, runner_model: str, output_format: str) -> None:
    tasks = load_tasks(plan_dir)
    selection = select_current_subtask(tasks)
    state = load_run_state(plan_dir)

    if selection is None:
        state.update(
            {
                "currentRunId": None,
                "currentPrdId": current_prd_id(plan_dir),
                "currentEpicId": None,
                "currentTaskId": None,
                "currentSubTaskId": None,
                "attemptCount": 0,
                "retrievalRound": 0,
                "lastModel": runner_model,
                "escalated": False,
                "lastFailureReason": None,
                "requiredModel": None,
                "runnerName": runner,
                "escalateIf": [],
                "filesToTouch": [],
                "lastCommitChanged": False,
            }
        )
        save_run_state(plan_dir, state)
        emit({"runner_state_result": "no-tasks"}, output_format)
        return

    task, subtask = selection
    same_subtask = (
        state.get("currentTaskId") == task.id and state.get("currentSubTaskId") == subtask.id
    )
    attempt_count = int(state.get("attemptCount") or 0) + 1 if same_subtask else 1
    retrieval_round = int(state.get("retrievalRound") or 0) if same_subtask else 0
    current_prd = current_prd_id(plan_dir)
    should_retrieve = (
        task_touches_previously_worked_area(plan_dir, task, subtask)
        and retrieval_round < 3
    )
    if should_retrieve:
        retrieval_round += 1

    escalated = bool(state.get("escalated")) if same_subtask else False
    effective_model = subtask.model
    if escalated:
        effective_model = max_model(subtask.model, "high")

    state.update(
        {
            "currentRunId": make_run_id(task, subtask),
            "currentPrdId": current_prd,
            "currentEpicId": task.epic_id,
            "currentTaskId": task.id,
            "currentSubTaskId": subtask.id,
            "attemptCount": attempt_count,
            "retrievalRound": retrieval_round,
            "lastModel": runner_model,
            "requiredModel": effective_model,
            "runnerName": runner,
            "escalated": escalated,
            "lastFailureReason": state.get("lastFailureReason") if same_subtask else None,
            "escalateIf": subtask.escalate_if,
            "filesToTouch": subtask.files_to_touch,
            "lastCommitChanged": False,
        }
    )
    save_run_state(plan_dir, state)

    emit(
        {
            "runner_state_result": "task",
            "current_run_id": state["currentRunId"],
            "current_prd_id": state["currentPrdId"] or "",
            "current_epic_id": task.epic_id,
            "current_task_id": task.id,
            "current_task_path": str(task.path.relative_to(plan_dir.parent)),
            "current_task_title": task.title,
            "current_subtask_id": subtask.id,
            "current_subtask_title": subtask.title,
            "current_subtask_status": subtask.status,
            "current_required_model": effective_model,
            "current_escalate_if": subtask.escalate_if,
            "current_files_to_touch": subtask.files_to_touch,
            "current_attempt_count": attempt_count,
            "current_retrieval_round": retrieval_round,
            "current_should_retrieve": should_retrieve,
            "current_escalated": state["escalated"],
        },
        output_format,
    )


def record_result(
    plan_dir: Path,
    result: str,
    runner_model: str,
    reason: str,
    commit_changed: bool,
    output_format: str,
) -> None:
    state = load_run_state(plan_dir)
    current_task_id = state.get("currentTaskId")
    current_subtask_id = state.get("currentSubTaskId")

    if result == "no-tasks":
        state.update(
            {
                "lastModel": runner_model,
                "lastFailureReason": None,
                "escalated": False,
                "lastCommitChanged": commit_changed,
            }
        )
        save_run_state(plan_dir, state)
        emit({"recorded_result": "no-tasks"}, output_format)
        return

    if not current_task_id or not current_subtask_id:
        raise SystemExit("Run state does not identify a current task/sub-task")

    task_path = plan_dir / next(
        str(path.relative_to(plan_dir))
        for path in (plan_dir / "epics").glob("*/tasks/*.md")
        if parse_frontmatter(read_text(path)).get("id") == current_task_id
    )
    task_text = read_text(task_path)
    task_frontmatter = parse_frontmatter(task_text)

    escalate_if = state.get("escalateIf") or []
    attempt_count = int(state.get("attemptCount") or 0)
    retrieval_round = int(state.get("retrievalRound") or 0)
    recorded_result = result
    recorded_reason = reason.strip()
    escalated = bool(state.get("escalated"))

    if result == "retry":
        if attempt_count >= 2 and "failing-twice" in escalate_if:
            escalated = True
        if retrieval_round >= 3 and not commit_changed:
            recorded_result = "blocked"
            recorded_reason = "history-retrieval-exhausted"

    if recorded_result == "success":
        task_text = set_subtask_field(task_text, current_subtask_id, "status", "done")
        task_text = set_subtask_field(task_text, current_subtask_id, "blocked-by", "[]")
        task_text = set_frontmatter_value(task_text, "blocked-by", "[]")
        state["lastFailureReason"] = None
    elif recorded_result == "blocked":
        blocker = recorded_reason or "blocked"
        task_text = set_subtask_field(task_text, current_subtask_id, "status", "blocked")
        task_text = set_subtask_field(task_text, current_subtask_id, "blocked-by", serialize_list_value([blocker]))
        task_text = set_frontmatter_value(task_text, "blocked-by", serialize_list_value([blocker]))
        state["lastFailureReason"] = blocker
    else:
        task_text = set_subtask_field(task_text, current_subtask_id, "status", "in-progress")
        task_text = set_subtask_field(task_text, current_subtask_id, "blocked-by", "[]")
        task_text = set_frontmatter_value(task_text, "blocked-by", "[]")
        state["lastFailureReason"] = recorded_reason or "retrying"

    write_text(task_path, task_text)
    sync_state(plan_dir)

    state.update(
        {
            "lastModel": runner_model,
            "escalated": escalated,
            "lastCommitChanged": commit_changed,
        }
    )
    save_run_state(plan_dir, state)

    emit(
        {
            "recorded_result": recorded_result,
            "recorded_reason": state.get("lastFailureReason") or "",
            "recorded_escalated": escalated,
        },
        output_format,
    )


def main() -> None:
    plan_dir = Path(sys.argv[1]).resolve()
    args = parse_args(sys.argv[2:])

    if args.command == "prepare-attempt":
        prepare_attempt(plan_dir, args.runner, args.runner_model, args.format)
        return

    if args.command == "record-result":
        record_result(
            plan_dir,
            args.result,
            args.runner_model,
            args.reason,
            args.commit_changed == "true",
            args.format,
        )
        return

    raise SystemExit(f"Unknown command: {args.command}")


if __name__ == "__main__":
    main()
PY
