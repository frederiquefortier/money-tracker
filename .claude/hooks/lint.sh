#!/bin/sh
# Stop: one ESLint run (with --fix) over the app files changed since the last clean run.
# Blocks once with what ESLint cannot fix (stop_hook_active). CI runs the full lint.
input=$(cat)
case "$input" in *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0;; esac
cd "$CLAUDE_PROJECT_DIR/src/app" 2>/dev/null || exit 0
stamp=$(git rev-parse --git-path claude-lint-stamp)
files=""
for f in $(git ls-files -m -o --exclude-standard -- '*.ts' '*.tsx' '*.js'); do
  [ -f "$f" ] || continue
  [ -f "$stamp" ] && [ ! "$f" -nt "$stamp" ] && continue
  files="$files $f"
done
[ -n "$files" ] || exit 0
command -v node >/dev/null || . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
# shellcheck disable=SC2086
if out=$(npx --no-install eslint --fix --cache --cache-location node_modules/.cache/eslint/ $files 2>&1); then
  touch "$stamp"
  exit 0
fi
node -e 'process.stdout.write(JSON.stringify({decision: "block", reason: "ESLint:\n" + process.argv[1]}))' "$out"
exit 0
