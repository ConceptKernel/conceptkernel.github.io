#!/usr/bin/env bash
# Pull the published law from its authority, byte for byte.
#
# The ontology is authored in styk-tv/pgCK under ontology/; this site republishes
# it when the digest changes. Only the law moves: every .ttl and its .sha256
# sidecars for the published lines, taken from a release TAG so the bytes on the
# site are the bytes that release enforces. Presentation (index.html, namespace
# pages) is owned by this site and is never overwritten.
#
# Usage: scripts/sync-ontology.sh <path-to-pgCK-checkout> <release-tag>
#   e.g. scripts/sync-ontology.sh ../pgCK v0.4.112
set -euo pipefail

src=${1:?usage: sync-ontology.sh <path-to-pgCK-checkout> <release-tag>}
ref=${2:?usage: sync-ontology.sh <path-to-pgCK-checkout> <release-tag>}
root=$(cd "$(dirname "$0")/.." && pwd)
dest="$root/docs/public/ontology"
LINES="v3.11 v3.12"

commit=$(git -C "$src" rev-parse --verify --quiet "$ref^{commit}") \
  || { echo "unknown ref in $src: $ref" >&2; exit 2; }

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
paths=""; for line in $LINES; do paths="$paths ontology/$line"; done
# shellcheck disable=SC2086
git -C "$src" archive "$commit" $paths | tar -x -C "$tmp"

changed=0
while IFS= read -r f; do
  rel=${f#"$tmp/ontology/"}
  mkdir -p "$dest/$(dirname "$rel")"
  if ! cmp -s "$f" "$dest/$rel"; then
    cp "$f" "$dest/$rel"; echo "updated  $rel"; changed=$((changed + 1))
  fi
done < <(find "$tmp/ontology" -type f \( -name '*.ttl' -o -name '*.sha256' \) | sort)

# Files the authority no longer carries are reported, never deleted: a published
# version is immutable, and removal is a decision, not a sync side effect.
while IFS= read -r f; do
  rel=${f#"$dest/"}
  [ -e "$tmp/ontology/$rel" ] || echo "extra    $rel  (not in $ref — left in place)"
done < <(for line in $LINES; do find "$dest/$line" -type f \( -name '*.ttl' -o -name '*.sha256' \); done | sort)

echo "$changed file(s) changed — source styk-tv/pgCK $ref ($commit)"
"$root/scripts/verify-ontology-digests.sh"
