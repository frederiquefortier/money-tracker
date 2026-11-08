# People on a transaction

**Status:** reviewed and built 2026-11-05, with the author's corrections below. Shared rules:
[02-screens.md](02-screens.md#shared-patterns). Builds on the transaction form (spec 15)
and the Proches screen (spec 19).

## Purpose

An expense is often shared: a dinner where I invited a friend, a cottage weekend where
everyone owes their part. This says who was there and how much of the expense is theirs,
so my own share is what counts as my spending, and what someone owes me can be followed
until it is paid back (spec 21). An income names who it came from.

## Requirements

PPL-03 (people on a transaction, a role, a part by amount, share or percentage), PPL-04
(the same without naming anyone). Reimbursements (TRX-07) and what is owed (PPL-05) are
spec 21. Money I owe someone who paid for me is out of scope: there is no transaction in
my accounts until I pay them back (decided 2026-11-05).

## Layout

```
┌──────────────────────────────┐
│ NOUVELLE TRANSACTION       ✕ │
│ [ Dépense ][ Revenu ][Transf.]│
│ ┌──────────────────────────┐ │
│ │ (◉)      90,00   (CAD ▾) │ │
│ │ RÉPARTIR                 │ │
│ │ - - - - - - - - - - - - -│ │
│ │ PAR  [Montant][Parts][ % ]│ │
│ │ (👤) Moi              1    │ │
│ │                   30,00  │ │
│ │ (A) Alex… [Invité]   1  ✕ │ │
│ │ (S) Sam  [Me doit]   1  ✕ │ │
│ │ (⋯) 2 pers. −+ [Invité] 2 ✕│ │
│ │ ( )+                     │ │
│ │ - - - - - - - - - - - - -│ │
│ │ EN ATTENTE             ☐ │ │
│ └╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲┘ │
│ Magasin      [Chez Lola    ✕]│
│ Compte *  [Chèque · Desjardins▾]│
│ ...                          │
└──────────────────────────────┘
```

On a Revenu, the receipt has no people; the Magasin field becomes **Proche**.

## Content and behaviour

### Where it is (decided 2026-11-05)

- **On an expense**, the receipt always ends its people part with a round add button,
  after its own dashed rule: an empty dashed circle with the `user` icon and a plus
  badge, as for an empty category ("Ajouter un proche" as its tooltip and accessible
  name). Alone while no one is on the expense; once someone is, it sits last, under the
  lines. It opens the people list. There is no Proches field under the receipt and no
  label on the slip.
- **On an income**, one person at most, who it came from (a gift from Maman): the
  **Proche** field replaces Magasin (the shared `Combobox`, names and aliases matching,
  "Créer « … »", the avatar beside each). Their line takes the whole amount; an income
  has no merchant. Switching an expense to an income keeps its first named person and
  clears the merchant; back to an expense, Moi returns and that person is invited.
- Transfers and adjustments have no people.

### The people list

Over the whole sheet, like the category list (spec 15): a back arrow and the title, then:

- A search (`SearchField`) staying put above the list (`SheetHead`), ignoring case,
  accents, and matching aliases (PPL-06). No sort and no "Tout déplier" here: they
  belong to the pages.
- **Fréquents:** the people most often on transactions in the last 90 days, as a row of
  avatars with their names (ticked ones tinted), hidden while searching.
- **The people, grouped as in the list's filter** (decided 2026-11-05, the shared
  `usePeopleTree`): a card per group with its members, folding, "Tout" ticking them, a
  person in several groups in each, then "Sans groupe" for the others; with no groups,
  the people in one card; while searching, the matches flat. Archived people and groups
  are not listed, unless already on the transaction.
- A card of its own follows: **+ Nouveau proche** (`CreateRow`: a name field, Enter
  creates the person and ticks them), then **Sans nom** with a − and + around how many
  people without a name are on the expense: a tap shows at once, 0 removes the line.
- Going back keeps what was ticked. A group is never a line of its own, only its
  members (decided 2026-11-05), so each person's part and what they owe stay their own.

### The people's lines (on the receipt)

- **Par** (the splits' `ModeLine`): Montant, Parts (the default, every line at 1, a line
  without a name at its count), or %. One mode for the whole expense.
- **Moi** is always the first line, with the `user` icon, and cannot be removed. It can
  be 0, when I paid entirely for others.
- **Each line:** the avatar, the name on one line ending with "…" when long, and on its
  right the controls; then the value typed on the slip, its computed amount under it in
  Parts and %, and a ✕.
- **The role** is a bubble (`chip`): Invité (the default) or Me doit; a tap switches
  it. Its accessible name is "Rôle de {name}: {role}".
- **A line without a name** (PPL-04), with the person icon or a group's icon past one,
  reads "{count} personnes", its − and + before the
  role bubble, so they read as people, not as the amount.
- **An empty field means not known yet** and never stops the save (spec 21): an empty
  Me doit is set by its reimbursement; an empty Moi or Invité takes what is left.
- **The remaining line** works as for the splits; in Montant and %, everything must be
  shared to save. It counts the typed lines only, in Montant as in %, so with empty
  lines it says what is left for them ("Reste 60,00 $ à répartir"), never "Tout est
  réparti" when nothing is set (asked by the author 2026-11-08). Parts always share everything; the last line takes the rounding cent.
- The amounts are in the account's currency, the transaction's `amount`.
- **With splits**, each person's part comes off each category in proportion (Q5).

### What it means for my spending

- My spending is the Moi line, plus what I invited others to (Invité lines are spending
  I chose to make). Me doit lines are not my spending once they are paid back; until
  then they are money owed to me (spec 21).
- The transaction's amount on the list stays the whole amount debited.

### On the transactions list (spec 14)

- A row with people shows their avatars, stacked like a group's (`AvatarStack`, the
  small size), after its second line's text, a line without a name as the person icon,
  or a group's icon when it counts several; their names for screen readers.
- **A row where someone owes me** (a Me doit line) is amber (`--owed`), as a pending
  row is blue, with "Quelqu'un me doit sa part" for screen readers; pending wins when
  both. An amber "2 me doivent" bubble keeps only those rows, as En attente does (spec
  14). Spec 21 clears it once paid back (DSH-05).
- **Proches** joins the list's filters (built now, decided 2026-11-05): groups as cards
  like institutions, a person in several groups in each, "Sans groupe" for the others,
  a flat list of matches while searching. A search of the list also matches people's
  names.

## States

- **No proche yet:** the people list shows "+ Nouveau proche" and Sans nom.
- **Changing the amount:** Parts and % follow; Montant lines stay and the remaining line
  says what is left.
- **Deleting a person on transactions** (spec 19's trash): "Les {count} transactions
  gardent leurs montants; ses lignes passent à “Sans nom”." The lines stay as anonymous
  lines, so my share does not change.

## Data

- `transaction_people` (migration `transaction_people`): `transaction_id`, `position`,
  `role` (`me`/`invited`/`owes`/`from`), `person_id` (null for Moi and lines without a
  name), `head_count`, `input_mode`, `input_value`, `amount` (signed like the
  transaction; Moi can be 0). Composite keys with `user_id` (ADR-005); a person once per
  transaction, one Moi. A deferred constraint trigger checks the roles (an expense: one
  Moi, no `from`; an income: `from` only) and that the parts sum to the amount; it also
  runs when a transaction changes. Deleting a person sets their lines' `person_id` to
  null. pgTAP: `14_transaction_people`.
- `save_transaction` takes `people` as JSON and writes the lines with the splits
  (ADR-012); a zero Moi in Montant is allowed (`transaction_people_zero_me`).
- View `person_usage` (count, count over 90 days, last date): the Fréquents and the
  delete text. `list_transactions` returns each row's named `people` and takes
  `person_ids`.
- The PPL-04 columns on `transactions` (`treated_count`, `treated_amount`,
  `expected_reimbursement`) are dropped from the draft: lines without a name hold it.
  `settled_by_id` comes with spec 21; `my_split_amounts` with the dashboard.
- The import's `people` column (import.md) is written with the import spec.

## Copy

| Key | Français |
|---|---|
| Add | Ajouter un proche (the round button) |
| Income field | Proche |
| List | Proches, Retour au formulaire, Rechercher, Fréquents, Groupes, Personnes, Nouveau proche, Sans nom |
| Lines | Par, Montant, Parts, %, Moi, Retirer la ligne, Tout est réparti, Reste {amount} à répartir, Dépasse le montant de {amount} |
| Roles | Invité, Me doit; Rôle de {name}: {role} |
| Without a name | 1 personne, {count} personnes; Une personne de moins, Une personne de plus |
| Filter | Proches, Sans groupe, Rechercher un proche |
| Owed row | Quelqu'un me doit sa part (screen readers) |
| Delete a person | La transaction garde son montant; sa ligne passe à “Sans nom”. / Les {count} transactions gardent leurs montants; ses lignes passent à “Sans nom”. |
