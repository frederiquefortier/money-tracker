# People

**Status:** reviewed and built 2026-11-05. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

Proches are the people the money is spent with or for: who was invited, who owes a share.
They are set up once and rarely touched, so they live in the Réglages menu (decided
2026-11-05). This screen manages them and their groups; linking them to a transaction
(PPL-03, 04), reimbursements (TRX-07) and what is owed (PPL-05) are spec 20.

## Requirements

PPL-01 (name, icon, groups), PPL-02 (archive and hide), PPL-06 (aliases for the import).

## Proches

The interface says "Proche"; the code and these docs keep "person" and "people".

```
┌──────────────────────────────────┐
│ PROCHES                          │
│ [Rechercher                    ] │
│ [ Personnes ][ Groupes ]         │
│ ┌──────────────────────────────┐ │
│ │ (A) Alex                 ▣ 🗑 │ │
│ │     Escalade, Famille         │ │
│ │ (J) Sam                   ▣ 🗑 │ │
│ │     Escalade                  │ │
│ │ (S) Sam                  ▣ 🗑 │ │
│ └──────────────────────────────┘ │
│ ▸ Proches archivés (2)           │
│                              (+) │
└──────────────────────────────────┘
▣ archive   🗑 delete   (+) add
```

- Two tabs (`TabList`), Personnes (default) and Groupes, remembered per browser. A person
  can be in several groups, so groups are a tab of their own rather than cards holding
  their members (a person would show twice).
- A search field above the tabs (`SearchField`), searching the open tab, ignoring case
  and accents. Nothing found: "Aucun résultat.".
- **Trier** (`SortMenu`, beside the title): Nom A–Z (the default) or Nom Z–A, for both
  tabs, kept per browser (decided 2026-11-05).
- **Person row:** the person's avatar as tall as the two lines beside it (for now the
  first letter of the name, on the secondary colour), the name, and under it their groups in alphabetical order, joined by commas (no
  second line when they have none). The transaction count joins the row with spec 20.
- **Group row:** the group's icon is its members' avatars, overlapping, in a slot of fixed
  width so names line up: up to three, or two and "+N"; an empty dashed circle with no
  member. The members' names are under the group's name.
- Tapping a row opens its form.
- The round + fans out both choices from any tab (`FloatingAddButton`): Proche (the
  `user` icon) and Groupe (`users`).

### Row actions

On the row from `md` up, in the sheet header on phones (shared patterns): archive, trash.

- **Archiver** (PPL-02): the shared dialog with its date. An archived person or group
  leaves the pickers and moves to the collapsed "Proches archivés ({count})" or "Groupes
  archivés ({count})" section, with "Archivé le …" and the undo and trash icons. Past
  transactions keep them. Archiving a group leaves its members as they are.
- **Trash:** "Supprimer “{name}”" and "Cette action est irréversible.". Deleting a group
  never deletes its members. Deleting a person on transactions comes with spec 20.

## Person form

A route sheet over Proches (`/settings/people/new`, `/settings/people/{id}`).

- **Nom** required, unique per user ignoring case and accents, and never another
  person's alias. A duplicate shows "Ce nom est déjà utilisé.".
- **Groupes:** every group in the shared `CheckList` (the filters' list), alphabetical,
  each with its members' avatars, a whole row ticking its box. Archived groups are listed
  only while ticked, so a past membership is not lost. The card's last row, "+ Nouveau
  groupe", becomes a name field: Enter or the check creates the group and ticks it,
  Escape goes back. The group is saved at once, even if the person form is then
  cancelled, as a merchant created from the transaction form.
- **Alias** (PPL-06): other spellings of the name, so the import finds the person ("Lili"
  for Élise). A card like the groups' list: one alias per row with a × ("Retirer
  “{alias}”"), and "+ Nouvel alias" as its last row, a name field the same way. An alias
  already used by another person (name or alias), or twice here, is refused with "Ce nom
  est déjà utilisé." in a toast, since an import match must point to one person. Not
  shown on the Proches rows.
- Saving closes the sheet with "Proche créé." or "Proche enregistré.".

## Group form

The same sheet (`/settings/people/groups/new`, `/settings/people/groups/{id}`).

- **Nom***, unique among groups.
- **Membres:** the same `CheckList` over the people, each with their avatar, ending on
  "+ Nouveau proche". Memberships are edited from either form.
- "Groupe créé.", "Groupe enregistré.".

## States

- **No person yet:** "Aucune personne pour le moment." (Personnes is the tab's name); no group: "Aucun groupe pour
  l'instant.".
- **Save fails:** values kept, the error above the sheet's buttons (SET-07).

## Data

- Tables `people` and `person_groups` (`name`, `archived_on`) and
  `person_group_members` (`group_id`, `person_id`), with RLS, the MFA policy and pgTAP
  tests (`12_people`) that another user sees none of them. No icon column: avatars come
  from the names. Foreign keys include `user_id` (ADR-005). `archived_on` is a date, as
  the dialog asks one. Unique indexes on `fold_name(name)` per user.
- `person_aliases` (`person_id`, `alias`), unique per user ignoring case and accents.
  Two triggers keep names and aliases apart: an alias cannot repeat any person's name or
  another alias (`alias_taken`), and a name cannot repeat an alias (`name_is_alias`).
  `save_person` takes the aliases and replaces the stored ones (`13_person_aliases`).
- Server functions with the user's session: `getPeople`, `savePerson` (with its group
  ids), `saveGroup` (with its member ids), `archivePeopleRow` (a null date reactivates)
  and `deletePeopleRow`, both for a person or a group. Saving a person or a group with
  its memberships is one SQL function each, `save_person` and `save_person_group`, so the
  row and its links are written together (ADR-012).

## Copy

| Key | Français |
|---|---|
| Menu row | Proches (the `users` icon) |
| Screen title | Proches |
| Tabs | Personnes, Groupes |
| Sort | Nom A–Z, Nom Z–A; Trier: … (accessible name) |
| Empty | Aucune personne pour le moment., Aucun groupe pour l'instant. |
| Add | Ajouter un proche, Ajouter un groupe (the + fans out both) |
| Form titles | Nouveau proche, Modifier le proche, Nouveau groupe, Modifier le groupe |
| Fields | Nom, Groupes, Membres, Alias; Nouveau groupe, Nouveau proche, Nouvel alias as a list's last row; Retirer “{alias}” |
| Saved | Proche créé., Proche enregistré., Groupe créé., Groupe enregistré. |
| Archived | Proches archivés ({count}), Groupes archivés ({count}), Archivé le {date} |
| Delete | Supprimer “{name}”, Cette action est irréversible. |
| Duplicate | Ce nom est déjà utilisé. (shared) |
