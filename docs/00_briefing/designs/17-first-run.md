# First run

**Status:** not built. Shared rules: [02-screens.md](02-screens.md).

## Purpose

After the invitation, password and two-factor setup, a few short steps set the app up from scratch: language, currencies, accounts, the category tree. The history is imported afterwards onto these choices, so accounts and categories are decided fresh instead of inherited from the spreadsheet.

## Requirements

SET-01. Reuses the currency list, account form and category form.

## Flow

- Shown after the first sign-in at `aal2` until the last step is done. `profiles.onboarded_at` (joins the profile update grant) records it; until set, every signed-in page redirects here.
- Same frame as the sign-in screens (sunset background, cream card), 32rem wide. "Étape n sur 4" with dots, "‹ Retour" from step 2. Each step saves as it goes, so closing the tab resumes at the same step.
- Language and currencies must be completed. Accounts and categories can be left for later ("Je les créerai plus tard").

1. **Langue:** Français or English, prefilled from the language in use.
2. **Devises:** the Devises list, the five defaults, CAD as default; the display currency starts as the default.
3. **Comptes:** accounts grouped by institution, with the + opening the account and institution sheets over the step. "Continuer" once one exists.
4. **Catégories:** the category tree with the open tab's type; a branch is entered one child at a time. No starter set (SET-01). "Terminer" once one exists.

After: the Transactions tab opens on its empty state, which offers "Importer un historique".

## Edge cases

- A failed sheet save keeps its values and shows the error above the buttons; a failed step save is a toast.
- Coming back to a finished step shows what exists, editable.
