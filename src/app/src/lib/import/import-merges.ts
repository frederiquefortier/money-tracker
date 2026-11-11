import { MERGE_KINDS } from '#/lib/import/import'
import { applyEdits, NO_EDITS } from '#/lib/import/import-edits'
import { categoryParts, foldName, foldPath } from '#/lib/import/import-names'
import type { Edits } from '#/lib/import/import-edits'
import type {
  ImportInput,
  ImportRow,
  ImportWillCreate,
  MergeKind,
} from '#/lib/import/import'

// IMP-06: a new item is created as written, or merged into another. A merge renames it in
// the rows before they are sent, so the database only ever matches by name.

/** For each kind, the new item (folded) and the name it is merged into. */
export type Merges = Record<MergeKind, Partial<Record<string, string>>>

/** Everything decided about the new items: merged, or edited. */
/** The merchant texts that are a person, by folded text: the person's name. */
export type Persons = Partial<Record<string, string>>

export type Decisions = { merges: Merges; edits: Edits; persons: Persons }

export const NO_MERGES: Merges = {
  categories: {},
  merchants: {},
  people: {},
  events: {},
}

const MAX_CHAIN = 5

/** Follows A into B into C; stops on a loop. */
export function followName(name: string, map: Merges[MergeKind]) {
  let current = name
  for (let step = 0; step < MAX_CHAIN; step++) {
    const next = map[foldName(current)]
    if (next === undefined) return current
    if (foldName(next) === foldName(current)) return next
    current = next
  }
  return current
}

/** A merged category carries what is under it: "Sorties > Bars" follows "Sorties". */
function renamePath(path: string, map: Merges[MergeKind]) {
  const parts = categoryParts(path)
  for (let length = parts.length; length >= 1; length--) {
    const target = map[foldPath(parts.slice(0, length).join(' > '))]
    if (target !== undefined)
      return [target, ...parts.slice(length)].join(' > ')
  }
  return parts.join(' > ')
}

function followPath(path: string, map: Merges[MergeKind]) {
  let current = path
  for (let step = 0; step < MAX_CHAIN; step++) {
    const next = renamePath(current, map)
    if (next === current) return current
    current = next
  }
  return current
}

function renamed(
  rows: ReadonlyArray<ImportRow>,
  column: string,
  rename: (value: string) => string,
) {
  return rows.map((row) => {
    const value = row[column]
    return value ? { ...row, [column]: rename(value) } : row
  })
}

export function hasMerges(merges: Merges) {
  return MERGE_KINDS.some((kind) => Object.keys(merges[kind]).length > 0)
}

/** The rows with every merge applied; the same input when there is none. */
export function applyMerges(input: ImportInput, merges: Merges): ImportInput {
  if (!hasMerges(merges)) return input
  return {
    ...input,
    transactions: renamed(
      renamed(input.transactions, 'merchant', (v) =>
        followName(v, merges.merchants),
      ),
      'event',
      (v) => followName(v, merges.events),
    ),
    splits: renamed(input.splits, 'category', (v) =>
      followPath(v, merges.categories),
    ),
    people: renamed(input.people, 'person', (v) =>
      followName(v, merges.people),
    ),
  }
}

/** How many rows use each new item, by folded name (categories: it and everything under it). */
export function usageCounts(
  input: ImportInput,
): Record<MergeKind, Map<string, number>> {
  const counts: Record<MergeKind, Map<string, number>> = {
    categories: new Map(),
    merchants: new Map(),
    people: new Map(),
    events: new Map(),
  }
  const add = (kind: MergeKind, key: string) =>
    counts[kind].set(key, (counts[kind].get(key) ?? 0) + 1)
  for (const row of input.transactions) {
    if (row.merchant) add('merchants', foldName(row.merchant))
    if (row.event) add('events', foldName(row.event))
  }
  for (const row of input.people) {
    if (row.person) add('people', foldName(row.person))
  }
  for (const row of input.splits) {
    const parts = categoryParts(row.category ?? '')
    for (let length = 1; length <= parts.length; length++) {
      add('categories', foldPath(parts.slice(0, length).join(' > ')))
    }
  }
  return counts
}

/**
 * A merge of a merchant or a person leaves a trace: the spelling merged away is kept as an
 * alias of what it was merged into, so the next import of it lands there (MER-02, PPL-06).
 * The rows to add to the import, one per merged item.
 */
export function mergeAliasRows(
  will: Pick<ImportWillCreate, 'merchants' | 'people'>,
  merges: Merges,
): Array<ImportRow> {
  const rows: Array<ImportRow> = []
  const kinds = [
    ['merchant', 'merchants'],
    ['person', 'people'],
  ] as const
  for (const [kind, merge] of kinds) {
    for (const label of will[merge]) {
      if (merges[merge][foldName(label)] === undefined) continue
      rows.push({
        kind,
        name: followName(label, merges[merge]),
        alias: label,
      })
    }
  }
  return rows
}

export const NO_DECISIONS: Decisions = {
  merges: NO_MERGES,
  edits: NO_EDITS,
  persons: {},
}

/**
 * The aliases of the file follow what was decided: one of a merged or renamed name goes to
 * the new name, one of a removed name goes, and one now equal to its name is no alias.
 */
export function followedAliases(
  rows: ReadonlyArray<ImportRow>,
  { merges, edits }: Decisions,
) {
  const result: Array<ImportRow> = []
  for (const row of rows) {
    const kind = row.kind === 'person' ? 'people' : 'merchants'
    if (row.kind !== 'person' && row.kind !== 'merchant') {
      result.push(row)
      continue
    }
    const edit = edits[kind][foldName(row.name ?? '')]
    if (edit?.name === '') continue
    const name = followName(edit ? edit.name : (row.name ?? ''), merges[kind])
    if (foldName(name) !== foldName(row.alias ?? '')) {
      result.push({ ...row, name })
    }
  }
  return result
}

/** The rows with the decisions applied, and the aliases the merges leave. */
export function withDecisions(
  input: ImportInput,
  will: Pick<ImportWillCreate, 'merchants' | 'people'>,
  decisions: Decisions = NO_DECISIONS,
): ImportInput {
  const { merges, edits, persons } = decisions
  const merged = applyMerges(applyEdits(input, edits), merges)
  return {
    ...merged,
    aliases: [
      ...followedAliases(merged.aliases, decisions),
      ...mergeAliasRows(will, merges),
    ],
    counterparties: [
      ...merged.counterparties,
      ...Object.values(persons).map((name) => ({ name })),
    ],
  }
}

/** How many items have a choice made about them. */
export function decisionCount({ merges, edits, persons }: Decisions) {
  const sizes = [
    ...MERGE_KINDS.map((kind) => Object.keys(merges[kind]).length),
    ...Object.values(edits).map((map) => Object.keys(map).length),
    Object.keys(persons).length,
  ]
  return sizes.reduce((sum, size) => sum + size, 0)
}
