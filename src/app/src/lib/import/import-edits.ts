import { foldName } from '#/lib/import/import-names'
import type { ImportInput, ImportRow, MergeKind } from '#/lib/import/import'

// IMP-06: before it is created, a new merchant, person or event can be edited: given
// another name, or none, with some of its text moved to the note of the transactions that
// carry it. "?" or "Train de Paris" is no merchant: it goes into the note, or is dropped.

/** What a new item becomes: its name (empty: not created) and the text sent to the note. */
export type Edit = { name: string; note: string }
export type EditKey = Extract<MergeKind, 'merchants' | 'people' | 'events'>

/** For each kind, the new item (folded) and its edit. */
export type Edits = Record<EditKey, Partial<Record<string, Edit>>>

export const NO_EDITS: Edits = { merchants: {}, people: {}, events: {} }

export const EDITABLE: ReadonlyArray<MergeKind> = [
  'merchants',
  'people',
  'events',
]

export function isEditKey(kind: MergeKind): kind is EditKey {
  return EDITABLE.includes(kind)
}

/** Not created, and not kept anywhere. */
export const REMOVED: Edit = { name: '', note: '' }

export function hasEdits(edits: Edits) {
  return EDITABLE.some((kind) => Object.keys(edits[kind as EditKey]).length > 0)
}

/** The item is not created: its text is gone or in the note. */
export function isDropped(edit: Edit | null | undefined) {
  return edit?.name === ''
}

function editOf(map: Edits[EditKey], value: string | undefined) {
  return value ? map[foldName(value)] : undefined
}

function withNotes(row: ImportRow, parts: ReadonlyArray<string | undefined>) {
  const note = [...parts, row.note].filter((part) => part).join(' - ')
  return { ...row, note }
}

/** People: the lines of a removed person go; the text of an edit is added to the note. */
function editPeople(input: ImportInput, edits: Edits) {
  const notes = new Map<string, Array<string>>()
  const people: Array<ImportRow> = []
  for (const row of input.people) {
    const edit = editOf(edits.people, row.person)
    if (!edit) {
      people.push(row)
      continue
    }
    if (edit.note && row.ref) {
      notes.set(row.ref, [...(notes.get(row.ref) ?? []), edit.note])
    }
    if (edit.name !== '') people.push({ ...row, person: edit.name })
  }
  return { people, notes }
}

/** The rows with every edit applied; the same input when there is none. */
export function applyEdits(input: ImportInput, edits: Edits): ImportInput {
  if (!hasEdits(edits)) return input
  const { people, notes } = editPeople(input, edits)
  const transactions = input.transactions.map((row) => {
    const merchant = editOf(edits.merchants, row.merchant)
    const event = editOf(edits.events, row.event)
    const parts = [
      merchant?.note,
      event?.note,
      ...(notes.get(row.ref ?? '') ?? []),
    ]
    if (!merchant && !event && parts.every((part) => !part)) return row
    return withNotes(
      {
        ...row,
        merchant: merchant ? merchant.name : (row.merchant ?? ''),
        event: event ? event.name : (row.event ?? ''),
      },
      parts,
    )
  })
  return { ...input, transactions, people }
}
