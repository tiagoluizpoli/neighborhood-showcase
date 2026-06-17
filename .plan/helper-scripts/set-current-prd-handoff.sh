#!/usr/bin/env bash

set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/common.sh"

if (($# != 1)); then
  echo "Usage: set-current-prd-handoff.sh .plan/handoffs/<file>.md" >&2
  exit 1
fi

set_pointer "current-prd-handoff" "$1"
