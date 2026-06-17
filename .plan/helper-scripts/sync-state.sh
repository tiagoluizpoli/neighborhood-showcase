#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly DEFAULT_PLAN_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly PLAN_DIR="${PLAN_DIR_OVERRIDE:-${DEFAULT_PLAN_DIR}}"

python3 - "$PLAN_DIR" "$@" <<'PY'
import re
import sys
from collections import Counter
from pathlib import Path

STATUS_VALUES = {"ready", "in-progress", "blocked", "done"}


def parse_args(argv):
    if argv:
        raise SystemExit("Usage: sync-state.sh")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text_if_changed(path: Path, content: str, changed_files: list[str]) -> None:
    existing = read_text(path)
    if existing != content:
        path.write_text(content, encoding="utf-8")
        changed_files.append(str(path))


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        raise SystemExit("Expected frontmatter block")

    end = text.find("\n---\n", 4)
    if end == -1:
        raise SystemExit("Unterminated frontmatter block")

    data: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if ": " not in line:
            continue
        key, value = line.split(": ", 1)
        data[key] = value
    return data


def set_frontmatter_value(text: str, key: str, value: str) -> str:
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        raise SystemExit("Expected frontmatter block")

    closing_index = None
    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            closing_index = index
            break
    if closing_index is None:
        raise SystemExit("Unterminated frontmatter block")

    target_prefix = f"{key}: "
    for index in range(1, closing_index):
        if lines[index].startswith(target_prefix):
            lines[index] = f"{key}: {value}\n"
            return "".join(lines)

    lines.insert(closing_index, f"{key}: {value}\n")
    return "".join(lines)


def parse_blocked_by(raw_value: str | None) -> list[str]:
    if not raw_value or raw_value == "[]":
        return []
    value = raw_value.strip()
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [part.strip() for part in inner.split(",") if part.strip()]
    return [value]


def blocked_display(values: list[str]) -> str:
    return "—" if not values else ", ".join(values)


def unique_preserving_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def derive_status(statuses: list[str]) -> str:
    if not statuses:
        return "ready"

    counts = Counter(statuses)
    total = sum(counts.values())

    if counts["done"] == total:
        return "done"
    if counts["in-progress"] > 0:
        return "in-progress"
    if counts["ready"] == total:
        return "ready"
    if counts["blocked"] == total:
        return "blocked"
    if counts["ready"] > 0:
        if counts["done"] > 0 or counts["blocked"] > 0:
            return "in-progress"
        return "ready"
    if counts["blocked"] > 0:
        return "blocked"
    return "in-progress"


def parse_subtask_statuses(text: str) -> list[str]:
    statuses: list[str] = []
    in_subtasks = False
    current_subtask = False

    for line in text.splitlines():
        if line.startswith("## Sub-Tasks"):
            in_subtasks = True
            current_subtask = False
            continue

        if in_subtasks and line.startswith("## ") and not line.startswith("### "):
            break

        if in_subtasks and line.startswith("### ST-"):
            current_subtask = True
            continue

        if current_subtask and line.startswith("status: "):
            value = line.split(": ", 1)[1].strip()
            if value not in STATUS_VALUES:
                raise SystemExit(f"Unknown sub-task status: {value}")
            statuses.append(value)
            current_subtask = False

    return statuses


def update_markdown_table(text: str, updates: dict[str, tuple[str, list[str]]], kind: str) -> str:
    lines = text.splitlines(keepends=True)
    updated_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped.startswith("|"):
            updated_lines.append(line)
            continue

        columns = [part.strip() for part in stripped.strip("|").split("|")]
        if kind == "task" and len(columns) >= 5 and columns[0].startswith("T-"):
            task_id = columns[0]
            if task_id in updates:
                status, blocked_by = updates[task_id]
                if len(columns) >= 6:
                    columns[3] = status
                    columns[4] = blocked_display(blocked_by)
                else:
                    columns[2] = status
                    columns[3] = blocked_display(blocked_by)
                line = "| " + " | ".join(columns) + " |\n"
        elif kind == "epic" and len(columns) >= 5 and columns[0].startswith("E-"):
            epic_id = columns[0]
            if epic_id in updates:
                status, blocked_by = updates[epic_id]
                columns[2] = status
                columns[3] = blocked_display(blocked_by)
                line = "| " + " | ".join(columns) + " |\n"

        updated_lines.append(line)

    return "".join(updated_lines)


def main(plan_dir: Path) -> None:
    parse_args(sys.argv[2:])

    epics_dir = plan_dir / "epics"
    index_file = plan_dir / "index.md"
    if not epics_dir.is_dir():
        raise SystemExit(f"No epics directory found at {epics_dir}")
    if not index_file.is_file():
        raise SystemExit(f"Missing index file at {index_file}")

    changed_files: list[str] = []
    task_records: dict[str, dict[str, object]] = {}

    for task_file in sorted(epics_dir.glob("*/tasks/*.md")):
        text = read_text(task_file)
        frontmatter = parse_frontmatter(text)
        task_id = frontmatter.get("id")
        epic_id = frontmatter.get("epic")
        if not task_id or not epic_id:
            raise SystemExit(f"Task file missing id/epic frontmatter: {task_file}")

        blocked_by = parse_blocked_by(frontmatter.get("blocked-by"))
        derived_status = derive_status(parse_subtask_statuses(text))
        updated_text = set_frontmatter_value(text, "status", derived_status)
        write_text_if_changed(task_file, updated_text, changed_files)

        task_records[task_id] = {
            "epic_id": epic_id,
            "status": derived_status,
            "blocked_by": blocked_by,
            "path": task_file,
        }

    epic_records: dict[str, dict[str, object]] = {}
    for epic_file in sorted(epics_dir.glob("*/epic.md")):
        text = read_text(epic_file)
        frontmatter = parse_frontmatter(text)
        epic_id = frontmatter.get("id")
        if not epic_id:
            raise SystemExit(f"Epic file missing id frontmatter: {epic_file}")

        blocked_by = parse_blocked_by(frontmatter.get("blocked-by"))
        child_tasks = {
            task_id: record
            for task_id, record in task_records.items()
            if record["epic_id"] == epic_id
        }
        derived_status = derive_status([record["status"] for record in child_tasks.values()])
        derived_blocked_by: list[str] = []
        if derived_status == "blocked":
            derived_blocked_by = unique_preserving_order(
                [
                    blocker
                    for record in child_tasks.values()
                    if record["status"] == "blocked"
                    for blocker in record["blocked_by"]
                ]
            )

        updated_text = set_frontmatter_value(text, "status", derived_status)
        updated_text = set_frontmatter_value(
            updated_text,
            "blocked-by",
            "[]" if not derived_blocked_by else "[" + ", ".join(derived_blocked_by) + "]",
        )
        updated_text = update_markdown_table(
            updated_text,
            {
                task_id: (record["status"], record["blocked_by"])
                for task_id, record in child_tasks.items()
            },
            kind="task",
        )
        write_text_if_changed(epic_file, updated_text, changed_files)

        epic_records[epic_id] = {
            "status": derived_status,
            "blocked_by": derived_blocked_by,
            "path": epic_file,
        }

    index_text = read_text(index_file)
    index_text = update_markdown_table(
        index_text,
        {
            epic_id: (record["status"], record["blocked_by"])
            for epic_id, record in epic_records.items()
        },
        kind="epic",
    )
    index_text = update_markdown_table(
        index_text,
        {
            task_id: (record["status"], record["blocked_by"])
            for task_id, record in task_records.items()
        },
        kind="task",
    )
    write_text_if_changed(index_file, index_text, changed_files)

    print("Synced task, epic, and index statuses.")
    if changed_files:
        print("Updated files:")
        for path in changed_files:
            print(f"- {path}")
    else:
        print("No status changes were needed.")


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
PY
