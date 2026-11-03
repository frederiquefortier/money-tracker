# First run

**Status:** reviewed 2026-11-03.

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

- The currency list from spec 10, in the card: the five defaults (CUR-01), stars for
  favourites, "Ajouter une devise", and a radio for the default currency (CUR-05),
  prefilled with CAD.
- The display currency starts as the default currency.

### 3. Comptes

- The accounts added so far, grouped by institution as in spec 11 (without totals), and
  "Ajouter un compte", which opens the account form (spec 11) over the step.
- The form's "Enregistrer et ajouter" saves and opens a fresh form with the same
  institution and currency, for entering several accounts in a row.
- "Continuer" once at least one account exists; otherwise "Je les créerai plus tard".

### 4. Catégories

- The category tree as in spec 12 (the three type tabs, icons and colours), and "Ajouter
  une catégorie", which opens the category form (spec 12) over the step.
- The form's "Enregistrer et ajouter" saves and opens a fresh form with the same type and
  parent, so a branch is entered one child after another. The parent field shows the last
  parent used; "Aucun (niveau principal)" starts a new branch.
- No starter set (SET-01).
- "Terminer" once at least one category exists; otherwise "Je les créerai plus tard".

### After

- The Transactions tab opens on its empty state (spec 14), which offers "Importer un
  historique".

## States

- **Save fails** on a step: the step stays, values kept, error at the top.
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
| Buttons | Continuer, Retour, Terminer, Enregistrer et ajouter |
| Steps | Langue, Devises, Comptes, Catégories |
| Currencies hint | Choisissez la devise par défaut et vos favorites. |
| Accounts hint | Ajoutez les comptes que vous suivez. Les autres pourront venir de l'import. |
| Categories hint | Construisez votre arbre de catégories. |
| Skip | Je les créerai plus tard |
