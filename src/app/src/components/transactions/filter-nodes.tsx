import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import type { CheckNode, CheckState } from '#/components/check-list'
import { accountLabel } from '#/lib/accounts'
import { KINDS, categoryPath } from '#/lib/categories'
import type { Category } from '#/lib/categories'
import type { Merchant } from '#/lib/merchants'
import type { FormAccount } from '#/lib/transactions'
import { treeOrder } from '#/lib/tree'
import { useFormatLocale } from '#/lib/use-locale'
import { foldForSearch, indexById } from '#/lib/utils'

// What the filter sheet's trees show and how a tick spreads (spec 14, TRX-14).

/** A node whose ticks are its children's: an institution, a category type. */
const GROUP = 'group:'

type Picked = ReadonlyArray<string>

function leafIds(node: CheckNode): Array<string> {
  return node.children?.map((c) => c.id) ?? [node.id]
}

/** A group is ticked when all its children are, partly when some are. */
function groupState(node: CheckNode, picked: Picked): CheckState {
  const ids = leafIds(node)
  const on = ids.filter((id) => picked.includes(id)).length
  if (on === 0) return 'off'
  return on === ids.length ? 'on' : 'mixed'
}

function toggleGroup(node: CheckNode, picked: Picked): Array<string> {
  const ids = leafIds(node)
  return groupState(node, picked) === 'on'
    ? picked.filter((id) => !ids.includes(id))
    : [...new Set([...picked, ...ids])]
}

/** Accounts under their institution: ticking one ticks all its accounts. */
export function useAccountTree(
  accounts: ReadonlyArray<FormAccount>,
  query: string,
) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const q = foldForSearch(query)
  const sorted = [...accounts].sort((a, b) =>
    a.name.localeCompare(b.name, locale),
  )
  if (q)
    return sorted
      .filter((a) => foldForSearch(accountLabel(a)).includes(q))
      .map((a) => ({ id: a.id, label: accountLabel(a) }))
  const groups = new Map<string, Array<CheckNode>>()
  for (const a of sorted) {
    const name = a.institution ?? t('transactions.noInstitution')
    groups.set(name, [...(groups.get(name) ?? []), { id: a.id, label: a.name }])
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b, locale))
    .map(([name, children]) => ({
      id: `${GROUP}${name}`,
      label: name,
      children,
    }))
}

/** Ticks that a group (an institution) spreads to its children; other nodes stand alone. */
export function groupTicks(picked: Picked) {
  const stateOf = (node: CheckNode): CheckState => {
    if (node.children) return groupState(node, picked)
    return picked.includes(node.id) ? 'on' : 'off'
  }
  const toggle = (node: CheckNode): Array<string> => {
    if (node.children) return toggleGroup(node, picked)
    if (picked.includes(node.id)) return picked.filter((id) => id !== node.id)
    return [...picked, node.id]
  }
  return { stateOf, toggle }
}

/** The Catégories tree under its types; a search lists the matches by full path. */
export function useCategoryTree(
  categories: ReadonlyArray<Category>,
  query: string,
) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const byId = indexById(categories)
  const q = foldForSearch(query)
  const icon = (c: Category) => (
    <CategoryBadge icon={c.icon} color={c.color} size="sm" />
  )
  if (q)
    return categories
      .map((c) => ({ id: c.id, label: categoryPath(c, byId), icon: icon(c) }))
      .filter((n) => foldForSearch(n.label).includes(q))
      .sort((a, b) => a.label.localeCompare(b.label, locale))
  const nodeOf = (c: Category): CheckNode => {
    const children = categories.filter((k) => k.parentId === c.id)
    return {
      id: c.id,
      label: c.name,
      icon: icon(c),
      children: children.length
        ? treeOrder(children, locale)
            .filter(({ depth }) => depth === 0)
            .map(({ item }) => nodeOf(item))
        : undefined,
    }
  }
  return KINDS.flatMap((kind) => {
    const tops = treeOrder(
      categories.filter((c) => c.kind === kind),
      locale,
    ).filter(({ depth }) => depth === 0)
    if (!tops.length) return []
    return [
      {
        id: `${GROUP}${kind}`,
        label: t(`categories.kinds.${kind}`),
        children: tops.map(({ item }) => nodeOf(item)),
      },
    ]
  })
}

/**
 * A ticked category takes its whole branch (the SQL does too), so its sub-categories
 * show ticked and greyed; a parent with some ticked below it shows partly ticked.
 * Unticking a greyed one keeps the rest of the branch ticked.
 */
export function categoryTicks(
  categories: ReadonlyArray<Category>,
  picked: Picked,
) {
  const byId = indexById(categories)
  const ancestors = (id: string): Array<string> => {
    const parent = byId.get(id)?.parentId
    return parent ? [parent, ...ancestors(parent)] : []
  }
  const descendants = (id: string): Array<string> =>
    categories
      .filter((c) => c.parentId === id)
      .flatMap((c) => [c.id, ...descendants(c.id)])
  const stateOf = (node: CheckNode): CheckState => {
    if (node.id.startsWith(GROUP)) return groupState(node, picked)
    if (picked.includes(node.id)) return 'on'
    if (ancestors(node.id).some((id) => picked.includes(id))) return 'implied'
    return descendants(node.id).some((id) => picked.includes(id))
      ? 'mixed'
      : 'off'
  }
  const siblings = (id: string) =>
    categories
      .filter((c) => c.parentId === byId.get(id)?.parentId && c.id !== id)
      .map((c) => c.id)
  // Unticking a sub-category of a ticked one keeps the rest of that branch: the
  // ticked parent gives way to every sibling on the path down to this node.
  const allBut = (id: string): Array<string> => {
    const path = [id, ...ancestors(id)]
    const top = path.findIndex((p) => picked.includes(p))
    const below = path.slice(0, top)
    return [
      ...picked.filter((p) => p !== path[top]),
      ...below.flatMap(siblings),
    ]
  }
  const toggle = (node: CheckNode): Array<string> => {
    if (stateOf(node) === 'implied') return allBut(node.id)
    if (node.id.startsWith(GROUP)) {
      const below = leafIds(node).flatMap(descendants)
      return toggleGroup(
        node,
        picked.filter((id) => !below.includes(id)),
      )
    }
    if (picked.includes(node.id)) return picked.filter((id) => id !== node.id)
    const below = descendants(node.id)
    return [...picked.filter((id) => !below.includes(id)), node.id]
  }
  return { stateOf, toggle }
}

/**
 * Merchants can run to thousands: the ticked ones first, then the most used, `shown` at
 * a time; a search looks through all of them.
 */
export function merchantNodes(
  merchants: ReadonlyArray<Merchant>,
  {
    query,
    picked,
    shown,
    locale,
  }: { query: string; picked: Picked; shown: number; locale: string },
) {
  const q = foldForSearch(query)
  const matching = merchants
    .filter((m) => !q || foldForSearch(m.name).includes(q))
    .sort(
      (a, b) =>
        Number(picked.includes(b.id)) - Number(picked.includes(a.id)) ||
        b.transactionCount - a.transactionCount ||
        a.name.localeCompare(b.name, locale),
    )
  return {
    nodes: matching.slice(0, shown).map((m) => ({ id: m.id, label: m.name })),
    more: matching.length > shown,
  }
}
