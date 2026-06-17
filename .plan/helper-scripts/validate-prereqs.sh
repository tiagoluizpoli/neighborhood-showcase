#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly PLAN_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: validate-prereqs.sh [--matt-skills-root PATH] [--require SKILL ...]

Validate local runtime prerequisites for the Ralph Loop framework.
EOF
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
}

main() {
  local matt_root="${HOME}/.agents/skills"
  local -a required_skills=()

  while (($# > 0)); do
    case "$1" in
      --matt-skills-root)
        matt_root="$2"
        shift 2
        ;;
      --require)
        required_skills+=("$2")
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo "Unknown argument: $1" >&2
        usage >&2
        exit 1
        ;;
    esac
  done

  require_command git

  for skill_name in "${required_skills[@]}"; do
    if [[ ! -f "${matt_root}/${skill_name}/SKILL.md" ]]; then
      echo "Missing external prerequisite skill: ${skill_name}" >&2
      echo "Expected at: ${matt_root}/${skill_name}/SKILL.md" >&2
      exit 1
    fi
  done

  echo "Prerequisites validated for ${PLAN_DIR}"
}

main "$@"
