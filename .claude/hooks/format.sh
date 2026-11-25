#!/bin/sh
# PostToolUse: format a file edited under src/app. ESLint runs once per turn in lint.sh:
# its typed rules rebuild the TypeScript program on every start (about 20 s).
f=$(sed -nE 's/.*"file_path"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/p')
app="$CLAUDE_PROJECT_DIR/src/app"
case "$f" in
  "$app"/*.ts|"$app"/*.tsx|"$app"/*.js) ;;
  *) exit 0 ;;
esac
command -v node >/dev/null || . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
cd "$app" || exit 0
npx --no-install prettier --write "$f" >/dev/null 2>&1
exit 0
