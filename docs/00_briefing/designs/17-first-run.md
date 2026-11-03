# First run

**Status:** reviewed 2026-11-03; aligned with the built screens 2026-11-03. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

The first time the owner reaches the app (after the invitation, the password and the
two-factor setup), a few short steps set it up from scratch: language, currencies,
accounts and the category tree. The history is imported afterwards onto these choices
(spec 18), so accounts and categories are decided here, fresh, instead of being inherited
from the old spreadsheet.

## Requirements

SET-01. It reuses the currency list (spec 10), the account form (spec 11) and the
category form (spec 12).

## Flow

```
┌──────────────────────────────┐
│ [logo]              FR  EN   │
│ ● ○ ○ ○  Étape 1 sur 4       │
│ ┌──────────────────────────┐ │
│ │ LANGUE                   │ │
│ │ ( ) Français             │ │
│ │ ( ) English              │ │
│ └──────────────────────────┘ │
│              [ Continuer › ] │
└──────────────────────────────┘
```

- Shown after the first sign-in at `aal2`, until the last step is done. A profile flag
  (`onboarded_at`) records that it is done; until then, every signed-in page redirects
  here.
- Same frame as the sign-in screens (the sunset background, a cream card), wider: 32rem.
- "Étape n sur 4" with dots; "‹ Retour" from step 2 on. Each step saves as it goes, so
  closing the tab and coming back resumes at the same step.
- Language and currencies must be completed. Accounts and categories can be left for
  later.

### 1. Langue

- Français or English, prefilled from the language already in use. Saved on the profile
  (SET-04, ADR-019).

### 2. Devises

- The Devises list from spec 10, as built: the five defaults (CUR-01), the star, house
  and trash on each row, "Ajouter une devise" beside the step title. CAD starts as the
  default (CUR-05).
- The display currency starts as the default currency.

### 3. Comptes

- The accounts added so far, grouped by institution as in spec 11 (without totals), and
  the "Ajouter" menu beside the step title, which opens the account or institution sheet
  over the step.
- After each save the sheet closes, the step lists the new account and "Ajouter" is in
  reach for the next one.
- "Continuer" once at least one account exists; otherwise "Je les créerai plus tard".

### 4. Catégories

- The category tree as in spec 12 (the three type tabs, icons and colours, the row
  actions), and "Ajouter une catégorie" beside the step title, which opens the category
  sheet over the step with the open tab's type.
- A branch is entered one child at a time: the parent is typed into the Parent field.
- No starter set (SET-01).
- "Terminer" once at least one category exists; otherwise "Je les créerai plus tard".

### After

- The Transactions tab opens on its empty state (spec 14), which offers "Importer un
  historique".

## States

- **Save fails** in a sheet: values kept, the error above the sheet's buttons. A failed
  step saves (language, currencies) say so in a toast.
- **Coming back** to a step already done shows what exists, editable, with the same add
  buttons.

## Data

- Writes: `setLocale` (exists), the currency functions of spec 10, `saveAccount` and
  `saveInstitution` (spec 11), `saveCategory` (spec 12), `completeOnboarding()`.
- New column: `profiles.onboarded_at` (timestamptz, null until done). It joins the
  profile's column update grant (database.md); setting it only skips the first run, so
  there is nothing to protect.

## Copy

| Key | Français |
|---|---|
| Progress | Étape {n} sur {total} |
| Buttons | Continuer, Retour, Terminer |
| Steps | Langue, Devises, Comptes, Catégories |
| Skip | Je les créerai plus tard |
