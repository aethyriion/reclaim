#!/usr/bin/env bash
# Run every reproduction and write EVIDENCE.txt.
#   SUPERO_API_KEY=ak_... ./run_all.sh
set -uo pipefail
cd "$(dirname "$0")"
OUT=../EVIDENCE.txt
{
  echo "Reclaim - reproduction evidence"
  echo "generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "host:      $(uname -sr)  python: $(python3 -V 2>&1)"
  echo
  for f in 0*.py; do
    echo; echo "### $f"; echo
    timeout 300 python3 "$f" 2>&1
    echo "(exit $?)"
  done
} | tee "$OUT"
echo
echo "written to $(cd .. && pwd)/EVIDENCE.txt"
