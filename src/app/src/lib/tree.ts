/**
 * The lines before one row of a tree drawn as a flat list (spec 12): `continues[k]` is a
 * vertical line through the row at level k + 1, and the last slot is the elbow, cut short
 * when the row is the last of its siblings.
 */
export type TreeGuide = {
  depth: number
  continues: Array<boolean>
  last: boolean
}

/** Guides for rows in depth-first order, given each row's depth. */
export function treeGuides(depths: ReadonlyArray<number>): Array<TreeGuide> {
  const nextAt = (from: number, level: number) => {
    for (let j = from + 1; j < depths.length; j++) {
      const d = depths[j] ?? 0
      if (d < level) return false
      if (d === level) return true
    }
    return false
  }
  return depths.map((depth, i) => ({
    depth,
    continues: Array.from({ length: Math.max(depth - 1, 0) }, (_, k) =>
      nextAt(i, k + 1),
    ),
    last: !nextAt(i, depth),
  }))
}

/**
 * Depth-first order, each level sorted by name. An item whose parent is not in the list
 * starts at the top level.
 */
export function treeOrder<
  T extends { id: string; parentId: string | null; name: string },
>(items: ReadonlyArray<T>, locale: string): Array<{ item: T; depth: number }> {
  const ids = new Set(items.map((i) => i.id))
  const children = new Map<string | null, Array<T>>()
  for (const item of items) {
    const key = item.parentId && ids.has(item.parentId) ? item.parentId : null
    children.set(key, [...(children.get(key) ?? []), item])
  }
  for (const list of children.values())
    list.sort((a, b) => a.name.localeCompare(b.name, locale))
  const out: Array<{ item: T; depth: number }> = []
  const walk = (parent: string | null, depth: number) => {
    for (const item of children.get(parent) ?? []) {
      out.push({ item, depth })
      walk(item.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
}
