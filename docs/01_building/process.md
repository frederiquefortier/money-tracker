# How this gets built

This repo is built with an AI assistant (Claude), under the rules in
[CLAUDE.md](../../CLAUDE.md), enforced partly by hooks in `.claude/settings.json`. The author
decides; the assistant proposes, implements and documents. Who asked for what is recorded in
[sessions.md](sessions.md), and why a structural choice was made in
[decisions.md](decisions.md).

## Why the docs come first

The assistant starts every session with no memory of the last. Anything not written down is
re-derived, plausibly, and can contradict an earlier decision. So the docs are the state the
work runs on:

- [requirements.md](../00_briefing/requirements.md) gives every feature an ID and a source.
- [decisions.md](decisions.md) records the alternatives that were rejected, so they are not
  proposed again.
- The raw notes in [notes/](../00_briefing/notes/) stay verbatim, so the organised version
  can be checked against what was asked.

## The rules, and the failure each prevents

- **Design before code.** Options and trade-offs, then an explicit decision, then code. A
  plausible implementation looks finished, so the thinking never happens.
- **Every structural decision is an ADR, written when it is made.** Written afterwards, it
  documents what was built and loses the alternatives.
- **Platform first, then mainstream** (ADR-011). The assistant tends to add a library per
  concern. Every dependency is listed in ADR-011 with why the native version is not enough.
- **Real data never enters a transcript.** A hook denies reads of `src/data/local/`, `.env`
  files and dumps. Category names and counts are discussed; amounts, memos and people are not.
- **The assistant never commits.** It proposes a message; the author reads the diff and commits.
- **Docs are part of done.** The definition of done in CLAUDE.md names the doc each kind of
  change updates, and a stop hook flags code changed without docs.

## How the output is checked

| Risk | Check |
|---|---|
| A table readable by another user | pgTAP test per table: a second user sees zero rows |
| A multi-row write half applied | One SQL function, with pgTAP tests of its invariants (ADR-012) |
| Type drift between form, server and database | One Zod schema per input, generated database types, strict type-check in CI |
| A missing translation | English resources typed against French; the type-check fails (ADR-008) |
| Docs drifting from code | Definition of done, the stop hook, a link and requirement-ID check in CI |
| A design flaw nobody asked about | Whole-plan review passes, requested by the author |

## What the author supplies

The feature list (eight years of running a budget by hand), feedback from a first prototype (Lovable),
every scope cut, and the taste rules: mainstream tools, few dependencies, plain prose. The
assistant follows them once written; it does not arrive at them.
