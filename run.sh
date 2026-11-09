#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ $# -ne 1 ]]; then
  echo "Error: exactly one profile is required."
  echo "Usage: bash run.sh --rehearsal | --loadtest"
  exit 1
fi

case "$1" in
  --rehearsal)
    PROFILE="rehearsal"
    ;;
  --loadtest)
    PROFILE="load"
    ;;
  *)
    echo "Error: unknown profile '$1'."
    echo "Usage: bash run.sh --rehearsal | --loadtest"
    exit 1
    ;;
esac

if [[ ! -f .env ]]; then
  echo "Error: .env file not found."
  exit 1
fi

set -a
source .env
set +a

if [[ -z "${BASE_URL:-}" ]]; then
  echo "Error: BASE_URL must be defined in .env."
  exit 1
fi

mkdir -p results
OUTPUT="results/get-cart-${PROFILE}-$(date +%Y%m%d-%H%M%S).json"

k6 run \
  -e "PROFILE=$PROFILE" \
  -e "BASE_URL=$BASE_URL" \
  --out "json=$OUTPUT" \
  scripts/get-cart.js