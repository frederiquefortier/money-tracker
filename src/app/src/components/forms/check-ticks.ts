import type { CheckNode, CheckState } from '#/components/forms/check-list'
import type { Category } from '#/lib/categories/category'
import { compareByUse } from '#/lib/merchants/merchant'
import type { Merchant } from '#/lib/merchants/merchant'
import { indexById } from '#/lib/shared/collections'
import { matcher } from '#/lib/shared/search'

// How a tick spreads in the check lists: filters (TRX-14) and the people on a
// transaction.

/** A node whose ticks are its children's: an institution, a category type. */
export const GROUP = 'group:'

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
 * Merchants can run to thousands: the ticked ones first, then the most used; the list
 * builds them as they near the screen, and a search looks through all of them.
 */
export function merchantNodes(
  merchants: ReadonlyArray<Merchant>,
  {
    query,
    picked,
    locale,
  }: { query: string; picked: Picked; locale: string },
): Array<CheckNode> {
  const matches = matcher(query)
  const byUse = compareByUse(locale)
  const matching = merchants
    .filter((m) => matches(m.name))
    .sort(
      (a, b) =>
        Number(picked.includes(b.id)) - Number(picked.includes(a.id)) ||
        byUse(a, b),
    )
  return matching.map((m) => ({ id: m.id, label: m.name }))
}
