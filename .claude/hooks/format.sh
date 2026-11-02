#!/bin/sh
# PostToolUse: format and lint-fix a file edited under src/app; report what eslint cannot fix.
f=$(sed -nE 's/.*"file_path"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/p')
app="$CLAUDE_PROJECT_DIR/src/app"
case "$f" in
  "$app"/*.ts|"$app"/*.tsx|"$app"/*.js) ;;
  *) exit 0 ;;
esac
command -v node >/dev/null || . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
cd "$app" || exit 0
npx --no-install prettier --write "$f" >/dev/null 2>&1
out=$(npx --no-install eslint --fix "$f" 2>&1) && exit 0
node -e 'process.stdout.write(JSON.stringify({hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: "ESLint:\n" + process.argv[1]}}))' "$out"
