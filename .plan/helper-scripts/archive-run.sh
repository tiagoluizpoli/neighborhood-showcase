#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly DEFAULT_PLAN_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly PLAN_DIR="${PLAN_DIR_OVERRIDE:-${DEFAULT_PLAN_DIR}}"

python3 - "$PLAN_DIR" "$@" <<'PY'
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path


def usage() -> str:
    return "Usage: archive-run.sh <run-family-id>"


def copy_path(source: Path, destination: Path, copied: list[str]) -> None:
    if not source.exists():
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    if source.is_dir():
        if destination.exists():
            shutil.rmtree(destination)
        shutil.copytree(source, destination)
    else:
        shutil.copy2(source, destination)
    copied.append(str(destination))


def read_pointer(pointer_file: Path) -> str | None:
    if not pointer_file.is_file():
        return None
    value = pointer_file.read_text(encoding="utf-8").strip()
    return value or None


def main() -> None:
    plan_dir = Path(sys.argv[1]).resolve()
    args = sys.argv[2:]
    if len(args) != 1 or not args[0].strip():
        raise SystemExit(usage())

    run_family_id = args[0].strip()
    archive_dir = plan_dir / "archive" / run_family_id
    archive_dir.mkdir(parents=True, exist_ok=True)

    copied: list[str] = []
    root_files = [
        "index.md",
        "PRD.md",
        "backlog.md",
        "progress.txt",
        ".run-state.json",
        ".run-history.jsonl",
        ".run-summary.md",
    ]
    for relative in root_files:
        source = plan_dir / relative
        destination = archive_dir / relative.replace(".run-", "run-")
        copy_path(source, destination, copied)

    copy_path(plan_dir / "epics", archive_dir / "epics", copied)

    pointer_map = {
        "current_prd": plan_dir / "prds" / ".current-prd",
        "current_grill": plan_dir / "grilling" / ".current-session",
        "current_grill_handoff": plan_dir / "handoffs" / ".current-grill-handoff",
        "current_prd_handoff": plan_dir / "handoffs" / ".current-prd-handoff",
    }

    manifest = {
        "runFamilyId": run_family_id,
        "archivedAt": datetime.now(timezone.utc).isoformat(),
        "planDir": str(plan_dir),
        "copiedFiles": [],
        "pointers": {},
    }

    for label, pointer_file in pointer_map.items():
        target = read_pointer(pointer_file)
        manifest["pointers"][label] = {
            "pointerFile": str(pointer_file),
            "target": target,
        }
        copy_path(pointer_file, archive_dir / pointer_file.relative_to(plan_dir), copied)
        if target:
            target_path = (plan_dir.parent / target).resolve()
            if target_path.exists():
                copy_path(target_path, archive_dir / target_path.relative_to(plan_dir.parent), copied)

    summary_file = plan_dir / ".run-summary.md"
    if summary_file.is_file():
        snapshot = plan_dir / "summaries" / f"{run_family_id}.md"
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(summary_file, snapshot)
        copied.append(str(snapshot))
        manifest["summarySnapshot"] = str(snapshot)

    manifest["copiedFiles"] = copied
    manifest_path = archive_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"Archived run family to {archive_dir}")
    print(f"Wrote manifest {manifest_path}")
    print("Copied artifacts:")
    for path in copied:
        print(f"- {path}")


if __name__ == "__main__":
    main()
PY
