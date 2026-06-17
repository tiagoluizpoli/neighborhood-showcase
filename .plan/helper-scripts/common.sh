#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly PLAN_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly REPO_ROOT="$(cd -- "${PLAN_DIR}/.." && pwd)"

pointer_file_for() {
  local pointer_kind="$1"

  case "$pointer_kind" in
    current-grill)
      printf '%s\n' "${PLAN_DIR}/grilling/.current-session"
      ;;
    current-prd)
      printf '%s\n' "${PLAN_DIR}/prds/.current-prd"
      ;;
    current-grill-handoff)
      printf '%s\n' "${PLAN_DIR}/handoffs/.current-grill-handoff"
      ;;
    current-prd-handoff)
      printf '%s\n' "${PLAN_DIR}/handoffs/.current-prd-handoff"
      ;;
    *)
      echo "Unknown pointer kind: ${pointer_kind}" >&2
      exit 1
      ;;
  esac
}

repo_path_for_plan_path() {
  local plan_path="$1"

  if [[ "$plan_path" != .plan/* ]]; then
    echo "Pointer targets must stay under .plan/: ${plan_path}" >&2
    exit 1
  fi

  printf '%s\n' "${REPO_ROOT}/${plan_path}"
}

set_pointer() {
  local pointer_kind="$1"
  local target_path="$2"
  local pointer_file repo_path

  pointer_file="$(pointer_file_for "$pointer_kind")"
  repo_path="$(repo_path_for_plan_path "$target_path")"

  if [[ ! -e "$repo_path" ]]; then
    echo "Pointer target does not exist: ${target_path}" >&2
    exit 1
  fi

  printf '%s\n' "$target_path" >"$pointer_file"
}

get_pointer() {
  local pointer_kind="$1"
  local pointer_file target_path repo_path

  pointer_file="$(pointer_file_for "$pointer_kind")"

  if [[ ! -f "$pointer_file" ]]; then
    echo "Pointer file is missing: ${pointer_file}" >&2
    exit 1
  fi

  target_path="$(tr -d '\n' <"$pointer_file")"

  if [[ -z "$target_path" ]]; then
    echo "Pointer file is empty: ${pointer_file}" >&2
    exit 1
  fi

  repo_path="$(repo_path_for_plan_path "$target_path")"

  if [[ ! -e "$repo_path" ]]; then
    echo "Pointer target no longer exists: ${target_path}" >&2
    exit 1
  fi

  printf '%s\n' "$target_path"
}
