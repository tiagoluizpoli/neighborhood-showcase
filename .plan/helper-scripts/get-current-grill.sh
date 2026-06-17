#!/usr/bin/env bash

set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/common.sh"

if (($# != 0)); then
  echo "Usage: get-current-grill.sh" >&2
  exit 1
fi

get_pointer "current-grill"
