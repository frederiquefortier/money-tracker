#!/bin/sh
# PreToolUse: keep real data and secrets out of transcripts. Bash is matched on its command
# text, which is best effort; the deny rules in settings.json back it up.
input=$(cat)
case "$input" in
  *'"tool_name":"Bash"'*|*'"tool_name": "Bash"'*)
    target=$(printf '%s' "$input" | sed -nE 's/.*"command"[[:space:]]*:[[:space:]]*"(([^"\\]|\\.)*)".*/\1/p') ;;
  *)
    target=$(printf '%s' "$input" | sed -nE 's/.*"(file_)?path"[[:space:]]*:[[:space:]]*"([^"]*)".*/\2/p') ;;
esac
target=$(printf '%s' "$target" | sed 's/\.env\.example//g')
# File names only: `process.env` and `json.dump(` pass.
private="data/local|(^|[[:space:]/\"'=])\.env([.[:space:]\"']|$)|\.(dump|age)([[:space:]\"']|$)"
if printf '%s' "$target" | grep -qE "$private"; then
  printf '%s' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"src/data/local, .env files and dumps hold real financial data or secrets. They are never read into a transcript."}}'
fi
exit 0
