#!/usr/bin/env bash
# Overlay this checkout's build onto an npm-installed dsh (the `wsl-local` fork branch).
#
#   pnpm run build:official && scripts/wsl-local/deploy.sh [--dry-run]
#
# For every @deepseek-ai package installed under $DSH_APP, sync the matching
# workspace package's build output. lib/: files the install already has are
# updated; a build file the install lacks is added only if `npm pack` would
# publish it (the build also emits .js/.map files that are never shipped).
# dist/ is mirrored, since its asset names are content hashes. Replaced files
# go to a timestamped backup.
# Deploy all packages from ONE build: client CSS-module hashes derive from the
# build path, so a partial overlay would mix hashes.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DSH_APP="${DSH_APP:-$HOME/.dsh/app}"
NM="$DSH_APP/node_modules/@deepseek-ai"
DRY=(); [ "${1:-}" = "--dry-run" ] && DRY=(--dry-run)
[ -d "$NM" ] || { echo "no dsh install at $NM" >&2; exit 1; }
BACKUP="$(cd "$DSH_APP/.." && pwd)/backups/dsh-overlay-$(date +%Y%m%dT%H%M%S)"

declare -A SRC
while IFS= read -r pj; do
  name=$(node -e 'process.stdout.write(require(process.argv[1]).name||"")' "$pj")
  [[ "$name" == @deepseek-ai/* ]] && SRC["${name#@deepseek-ai/}"]="$(dirname "$pj")"
done < <(cd "$ROOT" && ls packages/*/*/package.json apps/*/package.json vendor/*/package.json \
           native/system/package.json native/system/packages/*/package.json 2>/dev/null | sed "s|^|$ROOT/|")

for inst in "$NM"/*/; do
  pkg=$(basename "$inst"); src="${SRC[$pkg]:-}"
  [ -n "$src" ] || { echo "skip $pkg (no workspace package)"; continue; }
  if [ -d "$inst/lib" ]; then
    [ -d "$src/lib" ] || { echo "build has no lib/ for $pkg — run the build first" >&2; exit 1; }
    rsync -rc --existing "${DRY[@]}" --out-format="update $pkg/lib/%n" \
      --backup --backup-dir="$BACKUP/$pkg/lib" "$src/lib/" "$inst/lib/"
    # New build files (e.g. a module a patch adds): add one only when the
    # install already ships a sibling with the same suffix in that directory,
    # i.e. the package publishes that kind of file there. The build also emits
    # type-side .js files some packages never ship; this rule leaves those out.
    while IFS= read -r f; do
      [ -e "$inst/$f" ] && continue
      dir=$(dirname "$f"); base=$(basename "$f")
      suffix=".${base#*.}"   # .js, .d.ts, ...
      [ -d "$inst/$dir" ] || continue
      compgen -G "$inst/$dir/*$suffix" >/dev/null || continue
      echo "add $pkg/$f"
      [ ${#DRY[@]} = 0 ] && { mkdir -p "$BACKUP/.added"; echo "$pkg/$f" >> "$BACKUP/.added/list"; cp "$src/$f" "$inst/$f"; }
    done < <(cd "$src" && find lib -type f ! -name '*.map' ! -name '*.tsbuildinfo')
  fi
  if [ -d "$inst/dist" ]; then
    [ -d "$src/dist" ] || { echo "build has no dist/ for $pkg — run the build first" >&2; exit 1; }
    rsync -rc --delete "${DRY[@]}" --out-format="update $pkg/dist/%n" \
      --backup --backup-dir="$BACKUP/$pkg/dist" "$src/dist/" "$inst/dist/"
  fi
done
[ ${#DRY[@]} = 0 ] && echo "backup: $BACKUP"
