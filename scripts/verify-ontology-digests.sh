#!/usr/bin/env bash
# The digest gate for the published law.
#
# Every .ttl under a published line is identified by its own sha256, pinned by
# one or more `<file>.<wave-tag>.sha256` sidecars beside it. The contract:
#   - the CURRENT sidecar is one that `shasum -c` passes against the bytes;
#   - historical sidecars are retained and fail by design (they pin superseded
#     revisions so old citations stay checkable);
#   - a file with NO passing sidecar is drift, and fails the gate.
#
# Usage:
#   scripts/verify-ontology-digests.sh              verify docs/public/ontology
#   scripts/verify-ontology-digests.sh <dir>        verify another ontology root
#   scripts/verify-ontology-digests.sh --self-test  prove the gate can fail
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
LINES="v3.11 v3.12"

verify() {
  local ont=$1 fail=0 checked=0
  for line in $LINES; do
    [ -d "$ont/$line" ] || { echo "FAIL  $line: line missing"; fail=1; continue; }
    while IFS= read -r ttl; do
      local dir base rel current="" sidecars=0
      dir=$(dirname "$ttl"); base=$(basename "$ttl"); rel=${ttl#"$ont/"}
      for sc in "$dir/$base".*.sha256; do
        [ -e "$sc" ] || continue
        sidecars=$((sidecars + 1))
        if (cd "$dir" && shasum -a 256 -c --status "$(basename "$sc")") 2>/dev/null; then
          current="$current ${sc#"$dir/$base."}"
        fi
      done
      checked=$((checked + 1))
      if [ "$sidecars" -eq 0 ]; then
        echo "FAIL  $rel: no sidecar"; fail=1
      elif [ -z "$current" ]; then
        echo "FAIL  $rel: none of $sidecars sidecar(s) matches the bytes — drift"; fail=1
      else
        echo "OK    $rel  $(shasum -a 256 "$ttl" | cut -c1-16)…  current:${current% }"
      fi
    done < <(find "$ont/$line" -name '*.ttl' | sort)
  done
  [ "$checked" -gt 0 ] || { echo "FAIL  no .ttl files found under $ont"; fail=1; }
  return $fail
}

if [ "${1:-}" = "--self-test" ]; then
  # Negative control: a changed byte in a published file must fail the gate.
  tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
  cp -R "$root/docs/public/ontology/." "$tmp/"
  printf '\n' >> "$tmp/v3.12/core.ttl"
  if verify "$tmp" >/dev/null; then
    echo "SELF-TEST FAIL: a tampered core.ttl passed the gate"; exit 1
  fi
  echo "SELF-TEST OK: a tampered core.ttl is refused"
  exit 0
fi

verify "${1:-$root/docs/public/ontology}"
