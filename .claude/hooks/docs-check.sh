#!/bin/sh
# Stop: code under src/ changed but no doc did. Asks once (stop_hook_active).
input=$(cat)
case "$input" in *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0;; esac
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
code=$(git status --porcelain -- src ':!src/data/local' 2>/dev/null)
docs=$(git status --porcelain -- docs CLAUDE.md README.md 2>/dev/null)
if [ -n "$code" ] && [ -z "$docs" ]; then
  printf '%s' '{"decision":"block","reason":"Code under src/ changed but no doc did. Check the definition of done in CLAUDE.md (requirements, database.md, ADRs, sessions.md, process.md). Update what applies, or say plainly that none applies, then stop."}'
fi
exit 0
