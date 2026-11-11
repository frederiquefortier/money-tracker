import { isDropped, isEditKey } from '#/lib/import/import-edits'
import type { Edit } from '#/lib/import/import-edits'
import { foldName, foldPath } from '#/lib/import/import-names'
import {
  followedAliases,
  mergeAliasRows,
  NO_DECISIONS,
  usageCounts,
} from '#/lib/import/import-merges'
import type { Decisions } from '#/lib/import/import-merges'
import type {
  ImportInput,
  ImportTargets,
  ImportWillCreate,
  MergeKind,
} from '#/lib/import/import'

// What the summary lists under "new": each kind, its items, and for the four
// kinds that can be merged (IMP-06) what each is merged into.

export const SECTION_KEYS = [
  'currencies',
  'institutions',
  'accounts',
  'accountChanges',
  'categories',
  'merchants',
  'counterparties',
  'people',
  'events',
  'aliases',
] as const
export type SectionKey = (typeof SECTION_KEYS)[number]

const MERGEABLE: Partial<Record<SectionKey, MergeKind>> = {
  categories: 'categories',
  merchants: 'merchants',
  people: 'people',
  events: 'events',
}

export type SectionItem = {
  /** What a merge is stored under: the name folded. */
  key: string
  label: string
  /** How many rows use it, for the kinds that can be merged. */
  uses: number | null
  mergedInto: string | null
  /** A merchant the author said is a person: it becomes theirs (ADR-038). */
  asPerson: boolean
  /** The item edited before it is created: renamed, or put in the note, or removed. */
  edit: Edit | null
  /** A line under the name, when the item is not an account or a counted name. */
  detail: { aliasOf: string; kind: string } | null
  /** For an account that takes the file's opening balance. */
  opening: { balance: string; currency: string; openedOn: string } | null
}

export type Section = {
  key: SectionKey
  mergeKind: MergeKind | null
  /** Its items can also be edited (merchants, people, events). */
  editable: boolean
  items: Array<SectionItem>
  /** The items neither merged nor dropped: what the import will create. */
  count: number
}

/** The aliases kept: those of the file, and the spellings merged away. Read only. */
function aliasSection(
  will: ImportWillCreate,
  input: ImportInput,
  decisions: Decisions,
): Section {
  const rows = [
    ...followedAliases(input.aliases, decisions),
    ...mergeAliasRows(will, decisions.merges),
  ]
  const items = rows.map((row, i): SectionItem => ({
    key: `alias-${i}`,
    label: row.alias ?? '',
    uses: null,
    mergedInto: null,
    asPerson: false,
    edit: null,
    detail: { aliasOf: row.name ?? '', kind: row.kind ?? '' },
    opening: null,
  }))
  return {
    key: 'aliases',
    mergeKind: null,
    editable: false,
    items,
    count: items.length,
  }
}

function accountLabel(name: string, institution: string | null) {
  return institution ? `${name} (${institution})` : name
}

function openingOf(
  input: ImportInput,
  name: string,
  institution: string | null,
): SectionItem['opening'] {
  const row = input.accounts.find(
    (a) =>
      foldName(a.name ?? '') === foldName(name) &&
      foldName(a.institution ?? '') === foldName(institution ?? ''),
  )
  if (!row) return null
  return {
    balance: row.opening_balance ?? '0',
    currency: row.currency ?? '',
    openedOn: row.opened_on ?? '',
  }
}

function labelsOf(
  will: ImportWillCreate,
  key: Exclude<SectionKey, 'aliases'>,
): Array<string> {
  if (key === 'accounts' || key === 'accountChanges') {
    return will[key].map((a) => accountLabel(a.name, a.institution))
  }
  return will[key]
}

/** The sections with something in them, in the order the summary shows them. */
export function buildSections(
  will: ImportWillCreate,
  input: ImportInput,
  decisions: Decisions = NO_DECISIONS,
): Array<Section> {
  const { merges, edits, persons } = decisions
  const usage = usageCounts(input)
  return SECTION_KEYS.map((key): Section => {
    if (key === 'aliases') return aliasSection(will, input, decisions)
    const mergeKind = MERGEABLE[key] ?? null
    const keyOf = key === 'categories' ? foldPath : foldName
    const items = labelsOf(will, key).map((label, i): SectionItem => {
      const itemKey = keyOf(label)
      const account =
        key === 'accountChanges' ? will.accountChanges[i] : undefined
      return {
        key: itemKey,
        label,
        uses: mergeKind ? (usage[mergeKind].get(itemKey) ?? 0) : null,
        mergedInto: mergeKind ? (merges[mergeKind][itemKey] ?? null) : null,
        asPerson: key === 'merchants' && persons[itemKey] !== undefined,
        edit:
          mergeKind && isEditKey(mergeKind)
            ? (edits[mergeKind][itemKey] ?? null)
            : null,
        detail: null,
        opening: account
          ? openingOf(input, account.name, account.institution)
          : null,
      }
    })
    return {
      key,
      mergeKind,
      editable: mergeKind !== null && isEditKey(mergeKind),
      items,
      count: items.filter(
        (item) => item.mergedInto === null && !isDropped(item.edit),
      ).length,
    }
  }).filter((section) => section.items.length > 0)
}

/**
 * What `item` can be merged into: the names that exist, then the other new ones of its
 * kind that are not themselves merged away.
 */
export function mergeOptions(
  section: Section,
  item: SectionItem,
  targets: ImportTargets,
): Array<string> {
  if (!section.mergeKind) return []
  const others = section.items
    .filter(
      (other) =>
        other.key !== item.key &&
        other.mergedInto === null &&
        !isDropped(other.edit),
    )
    .map((other) => other.label)
  return [...targets[section.mergeKind], ...others]
}
