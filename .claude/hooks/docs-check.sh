#!/bin/sh
# Stop: a migration, a dependency or a new route changed but no doc did. Asks once
# (stop_hook_active). Smaller code changes decide for themselves whether a doc applies.
input=$(cat)
case "$input" in *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0;; esac
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
code=$(
  git status --porcelain -- src/supabase/migrations src/app/package.json 2>/dev/null
  git status --porcelain -- src/app/src/routes 2>/dev/null | grep -E '^(\?\?|A )'
)
docs=$(git status --porcelain -- docs CLAUDE.md README.md 2>/dev/null)
if [ -n "$code" ] && [ -z "$docs" ]; then
  printf '%s' '{"decision":"block","reason":"A migration, a dependency or a new route changed but no doc did. Check the definition of done in CLAUDE.md (database.md, ADR-011, requirements.md, sessions.md). Update what applies, or say plainly that none applies, then stop."}'
fi
exit 0
