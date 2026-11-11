# Reimbursements and what is owed

**Status:** reviewed and built 2026-11-05. Shared rules:
[02-screens.md](02-screens.md#shared-patterns). Builds on spec 20 (people on a
transaction) and the transaction form (spec 15).

## Purpose

When someone owes me their part of an expense, the money comes back later as an income:
an e-Transfer from Sam three days after the dinner. Linking that income to the expense
settles Sam's line, so the expense stops showing as owed, and my spending is what I
really paid. Sometimes I do not know Sam's part when I pay: the reimbursement then
decides it (decided 2026-11-05). Each proche shows what they still owe me.

## Requirements

TRX-07 (link an income to an expense as its reimbursement), PPL-05 (what is owed, at a
glance; reminders), and the list's part of DSH-05 (an owed expense is highlighted, built
with spec 20; settled, it is not). The dashboard's net amounts are phase 4. Money I owe
someone who paid for me stays out of scope (spec 20).

## Content and behaviour

### An unknown amount (on the expense)

- **An empty field means not known yet**, on any line (decided 2026-11-08), and never
  stops the save; a line that becomes Me doit starts empty.
  - An empty **Me doit** part is set by its reimbursement, in every mode ("?" shows in
    the empty field).
  - An empty **Moi or Invité** takes what is left once the other parts are known: 1
    part in Parts, an equal share of what the typed lines leave in Montant and %. What
    it comes to shows under the field.
  - In **Montant**, typed lines keep their amounts; the empty ones absorb what a
    reimbursement changes. With nothing else empty, Moi absorbs it, typed or not, since
    Moi is what I really paid; a reimbursement never takes more than those lines can
    give up. What an income has over is not a gift: it stays an income in the expense's category, so that category's total can go below zero (decided 2026-11-11, a late roommate paying two months at once).
  - When the typed lines already take everything, "Répartissez tout le montant." or
    "Les pourcentages doivent totaliser 100." says so.
- Example, Parts: 90 $, Moi and Alex (invité) at 1 part each, Sam's part empty. Before
  Sam pays, Moi 45 and Alex 45. Sam's 25 $ linked: Sam 25, Moi 32,50, Alex 32,50.
- Example, Montant: 90 $, Alex typed 30, Moi and Sam empty. Moi is 60 until Sam pays;
  Sam's 25 $ linked: Sam 25, Moi 35, Alex 30.

### Linking a reimbursement (on the income)

- The income's Proche field (spec 20) offers **Sans nom** first, with the person icon:
  an income from someone without a name, whose Rembourse lists the owed lines without a
  name (reported by the author 2026-11-05: they could not be paid back).
- An income with its **Proche** set (spec 20) shows **Rembourse** under it, on the line
  of fields linked to it (`LinkedFields`): the shared `CheckList` of that person's open
  Me doit lines, newest first, each drawn like a transaction row (the expense's category
  icon, its merchant or category, the date under it, what is left on the right, or
  "montant inconnu"), at the inputs' text size (`CheckList` `small`), the box at its
  end. Ticking one links it.
- The income's amount is spread over the ticked lines in order: each takes what it is
  still owed, the last takes the rest; an unknown line takes all that is left. A line
  never takes more than it is owed: what the income has over stays an income in its category (not a gift).
- The first line ticked gives the income its expense's category (its largest), as a
  refund (decided 2026-11-05; spec 15: an expense category on an income lowers that
  category's spending), unless a category was chosen by hand. It stays editable.
- **On the expense's sheet**, each Me doit line shows what came back under it
  ("Remboursé le 8 nov. 2026 25,00 $"), then "Reste 5,00 $" for a known part not fully
  paid back. Linking is from the income only (decided 2026-11-05).
- Unlinking: unticking on the income. Deleting the income unlinks it; an unknown line
  becomes unknown again.

### On the transactions list

- A row stays amber while any Me doit line is open (partly paid back or unknown), and
  goes back to normal once every one is settled; the "me doivent" bubble counts open
  ones only.
- A reimbursing income shows the expense it pays back on its second line ("Rembourse:
  Chez Lola, 3 nov.").

### What each proche owes me (PPL-05)

- On **Proches**, a person who owes me shows it on their row as an amber tag: "Me doit
  45,00 $" (per currency, joined by "·"), "+ inconnu" when a part is not known yet, or
  "Me doit, montant inconnu".
- Their sheet lists those expenses under the form ("Me doit"), each with what is left
  or "montant inconnu", opening the expense on a tap. Nothing when nothing is owed.
- The "me doivent" bubble on Transactions and these tags are the reminders (PPL-05):
  nothing more, no notifications (decided 2026-11-05).

## States

- **An income with no Proche:** no Rembourse section. With Sans nom, the lines without a
  name.
- **A person with nothing open:** no Rembourse section; nothing on their row.
- **Changing a reimbursed expense's amount:** the links stay; a line now owed less than
  came back keeps what came back, and the gift rule applies.

## Data

- Migration `reimbursements`, then `empty_means_unknown`. `transaction_people.amount_unknown`
  (an empty `owes` line, any mode) and `fills_rest` (an empty Moi or Invité); its `amount` is null until something comes back, then what came back,
  and `recompute_people` shares the rest among the lines that absorb it (`absorbs`): in
  Parts or % every known line by its weight; in Montant the empty ones, or Moi.
  `empty_part_room` caps what a reimbursement gives an unknown part. The
  sum check counts the known amounts; a known part is never paid back more than it is.
- `reimbursements`: `owed_line_id` (→ `transaction_people`, an `owes` line), `income_id`
  (→ `transactions`, an income), `amount` (positive), composite keys with `user_id`,
  deleted with either side; deleting one recomputes its expense (an unknown part is
  unknown again).
- `save_transaction` takes `reimburses` (the income's owed lines, in order) and spreads
  the income over them in the same call (ADR-012); re-saving an expense keeps its
  links, matched by person, or by position for a line without a name.
- Views `owed_lines` (each owed line, its part, what came back, open or not, with the
  expense's date, merchant and largest category) and `person_balances` (open amount
  per currency, unknown count). The list's owed rows and bubble count open lines; an
  income row names what it pays back.
- pgTAP `15_reimbursements`: an unknown part shared, then set by its reimbursement and
  unknown again when the income goes; the gift rule; links kept through an edit; a line
  without a name paid back by an income from Sans nom; only an owed line paid back;
  another user sees nothing.

## Copy

| Key | Français |
|---|---|
| Unknown | ? (the empty field's placeholder), montant inconnu |
| Link | Rembourse, montant inconnu |
| On the expense | Remboursé le {date} {amount}, Reste {amount} |
| On the list | Rembourse: {label}, {date} |
| Proches | Me doit {amount}, + inconnu, Me doit, montant inconnu; Me doit (the sheet's list) |
