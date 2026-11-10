# Events

**Status:** reviewed and built 2026-11-09. Shared rules:
[02-screens.md](02-screens.md#shared-patterns). Builds on the transaction form (spec 15),
the list (spec 14) and the people (specs 19, 20). Calendar and comparison are spec 23.

## Purpose

An event is an occasion the money went to: a trip, a wedding, a move. It has a date range,
sometimes a type (Voyage, Fête) and people. Transactions carry it as a tag, linked by hand
or automatically from its dates, so what
an occasion cost is one tap away. Events and their types are set up now and then, so they
live in the Réglages menu beside Proches.

## Requirements

EVT-01 (types), EVT-02 (name, dates, type, people), EVT-03 (link by hand or automatically,
shown as a tag), EVT-07 (the automatic link by dates; categories were dropped 2026-11-09). Calendar and comparison
(EVT-04, 05) are spec 23; event budgets (EVT-06) are phase 4.

## Layout

```
┌──────────────────────────────────┐
│ ÉVÉNEMENTS            [Trier: …] │
│ [Rechercher                    ] │
│ [ Événements ][ Types ]          │
│ ┌──────────────────────────────┐ │
│ │ (✈) Lisbonne                  │ │
│ │     12 – 19 mai 2026   (A)(J) │ │
│ │                      34 🗑    │ │
│ │ (♥) Mariage de Sam             │ │
│ │     3 août 2026        (S)    │ │
│ └──────────────────────────────┘ │
│ ▸ Événements passés (6)          │
│                              (+) │
└──────────────────────────────────┘
```

From `md` up the row actions sit at the end of the row; on phones the trash is in the
sheet header (shared patterns).

## Content and behaviour

### The page

- `ListPage` titled Événements, with `SortMenu` on both tabs, so the title row never
  changes height: Date décroissante (the default), Date croissante, Nom A–Z, Nom Z–A on
  Événements; Nom A–Z, Nom Z–A on Types, each kept per browser. Dates and balances use
  "croissant" and "décroissant" everywhere (decided 2026-11-09; names stay A–Z, Z–A).
  A `SearchField` above the tabs searches the open tab, ignoring case and accents.
- Two tabs (`TabList`), Événements (default) and Types, remembered per browser.
- The round + fans out Événement (`calendar` icon) and Type (`tags`) (`FloatingAddButton`).
- **Event row:** a dot in the type's colour (a dashed, empty one when there is no type),
  the name, the date range under it, the event's
  people as stacked avatars (`AvatarStack`) and the number of linked transactions. Amounts
  spent are spec 23.
- **Past events** (EVT-02): an event is past once its end date, or its date when it has no
  end, is before today. There is no archive action and no archived date. Past events sit
  in a collapsed "Événements passés ({count})" section under the list and stay in every
  picker, since transactions are linked after the occasion.
- **Type row:** a dot in its colour, the name, and the number of events of that type.
- Tapping a row opens its form. Trash on both: events and types can be deleted.

### Event form

A route sheet over the page (`/settings/events/new`, `/settings/events/{id}`), on
`useSheetForm`.

- **Nom** required.
- **Type** (`Combobox`, `useInlineCreate`: "Créer « … »" opens the type form in a
  `FormSheet`). Optional.
- **Dates**, optional, as one range (`DateRangeField`, ADR-027): typed in segments, so the
  month and the year are entered directly, or picked in a calendar. The calendar comes up
  from the bottom of the sheet, full width and half its height, over a dim backdrop; a
  complete range closes it, and so do ✕, the backdrop and Escape. One day is the same day
  twice (stored with no end). A ✕ empties the field: an event with no dates. An (i) beside
  the label explains the automatic link on hover and focus: "Les dépenses et revenus de
  ces dates sont liés automatiquement à l’événement, dans les catégories choisies (toutes,
  si aucune). Sans dates, seules les catégories comptent." (decided 2026-11-09: the
  author's exception to "no helper text".)
- **Proches:** drawn as on the receipt: the people chosen listed with their avatar and a
  ✕, then the round add button (dashed circle, person icon, plus). The button opens the
  choices in a sheet over the form (`PickField`): the shared `CheckList` with
  `usePeopleTree`, a search, Effacer and Terminé. Archived people are listed only while
  ticked. The event's people do not touch a transaction's people lines or what is owed.
- The sheet only edits. The transactions linked to an event, and what it cost, come with
  spec 23's view (the calendar and the comparison), not here (decided 2026-11-10).

### Event type form

A route sheet (`/settings/events/types/new`, `.../{id}`).

- **Couleur** first, then **Nom** (required, unique per user ignoring case and accents).
  A type has no icon (decided 2026-11-09): a name and a colour. The colour is soft quick
  picks (`EVENT_SWATCHES`, 21 pastels) and the custom picker of the category form
  (spec 12, Colours), a hex `#rrggbb`, shared with it as `ColorGrid`.

### Tag colours

A tag is a soft pill (`tagColors(hex)`, one function): a tinted background and dark text
of the same hue, light mode and dark mode, readable whatever hex was chosen, like a Gmail
label. The category colours stay as they are. The same function draws the row's tag, the
row's badge and, in spec 23, the calendar. An event without a type gets the neutral
surface.

### Automatic link (EVT-07)

- Only expenses and incomes link, never transfers or adjustments. The whole transaction
  links, whatever its splits.
- A transaction matches an event when its date is in the event's dates, whatever its
  category (decided 2026-11-09: an event has no categories; the tag is removed by hand
  from a transaction that does not belong).
- **Dates are optional.** With a start and no end the event is one day; with no start the
  event is open on that side. An event with no dates links nothing by itself: its links
  are made by hand.
- Two automatic matches: the narrower range wins, then the earlier created event.
- A manual link is never changed by the rule. A transaction whose date leaves the range
  loses an automatic link and keeps a manual one.
- **Removing an automatic link by hand is remembered** (`event_exclusions`), so no later
  recompute puts it back. Choosing that event by hand again clears the exclusion.
- The link is recomputed when an event's dates change, and for one transaction when its
  date or kind change.

### On a transaction (EVT-03)

- **Événement** is a `Combobox` in the form's details, for expenses and incomes. Picking
  an event makes the link manual. Clearing it removes the link and, on save, remembers the
  event the rule would give, so it does not come back (an automatic link or a manual one
  alike).
- The field watches the date and the splits (a server function calls the same SQL
  matching function as `save_transaction`, debounced) and fills with the matching event,
  marked automatic, until the user picks or clears it by hand; then the form stops
  overriding. An automatic value clears by itself when the date leaves the range; a manual
  one stays.
- On the list (spec 14) the tag sits beside the row's name, on the first line: the
  event's name in its type's colour, with the small sparkle when the link is automatic. The transaction sheet shows the
  same.
- **Événements** joins the list's filter sheet (`FilterSheet`) as a tab of `CheckList`:
  "Sans événement" in a card of its own, then two cards, Événements and Événements passés
  (collapsed), with a search that lists the matches flat. The address carries `event`.

### Delete

- An event: `ConfirmDialog`, "Supprimer “{name}”" and "{count} transactions seront
  détachées de cet événement." when it has links, else "Cette action est irréversible.".
  Its links and exclusions go with it, manual or automatic alike.
- A type: the same dialog, "Les {count} événements de ce type n'en auront plus." The
  events keep their other fields.

## States

- **No event yet:** "Aucun événement pour l'instant." with the + button. Same for Types.
- **No match:** "Aucun résultat.".
- **An event with no transactions** shows 0.
- **Editing dates:** the links are recomputed in the same save; manual
  links stay even outside the new range.
- **Untyped events** show everywhere with the neutral tag; spec 23 leaves them out of the
  comparison and keeps them in the calendar.
- **Loading and error:** the shared skeleton and `RouteError`.

## Data

- Migration `events`: `event_types` (`name`, `color`), `events` (`type_id` set to
  null when its type is deleted, `name`, `starts_on` and `ends_on`, both nullable: no end is one day, no start is open),
  `event_people`, `event_exclusions` (`event_id`, `transaction_id`), and `transactions.event_id` and
  `event_source` (`manual`/`auto`). Every foreign key between user tables includes
  `user_id` (ADR-005); RLS in the same migration; deleting an event, a type or a
  transaction cleans its rows. `event_id` is refused on a transfer or adjustment.
- Functions: `save_event` (ADR-012; it replaces the people and puts the rule back over the
  dates it covered and now covers) and `save_event_type`, `delete_event`,
  `event_first_day` and `event_last_day` for the open ends, `matching_event(date, kind,
  transaction)` used by `save_transaction` and by the server function the form calls, and
  `relink_events(from, to)` for the recompute. `save_transaction` takes `event_id` and
  `event_choice` (`auto`, `manual`, `none`).
- `list_transactions` returns the event (name, type colour, source) and filters
  on `event_ids` and `without_event`; the view `event_usage` gives each event's
  transaction count.
- pgTAP `16_events`: a transaction in the dates linked whatever its category; the narrower
  range winning; a transfer and a date outside every event never linked; a manual link
  kept; a removed automatic link not coming back; a deleted event handing its transactions
  to the next one; an event with no dates linking nothing; a type deleted leaving its
  events; another user sees nothing.
- Code layout (ADR-026): `lib/events/` with `event.ts`, `event-draft.ts`,
  `event-list.ts`, and the same for types; `server/` holds the server functions only;
  components in `components/events/{list,form}`; the tag in `components/display`.
- Import: an optional `event` column (import.md), matched by exact name ignoring case and
  accents. An unknown name is a warning in the summary and creates nothing. An imported
  link is manual; the automatic link then runs on the other rows.

## Copy

| Key | Français |
|---|---|
| Page | Événements, Types, Événements passés ({count}) |
| Add | Ajouter un événement, Ajouter un type |
| Event form | Nom, Type, Dates, Proches |
| Type form | Couleur, Nom |
| Transaction | Événement, Sans événement |
| Delete | {count} transactions seront détachées de cet événement., Les {count} événements de ce type n'en auront plus. |
| Empty | Aucun événement pour l'instant., Aucun type pour l'instant. |

## Open questions

- None from the grilling of 2026-11-09. Spec 23 settles the comparison's metric and the
  calendar's amounts.
