import { childrenByParent, isActiveOn, sortSiblings } from '#/lib/categories'
import type { Category, CategorySort, Kind } from '#/lib/categories'
import { foldForSearch } from '#/lib/utils'

// The transaction form's category list (spec 15): one type's tree, as on Catégories.

/** The matches and their parents, so each keeps its place in the tree. */
function withParents(
  categories: ReadonlyArray<Category>,
  q: string,
): Set<string> {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const keep = new Set<string>()
  for (const category of categories) {
    if (!foldForSearch(category.name).includes(q)) continue
    for (
      let c: Category | undefined = category;
      c && !keep.has(c.id);
      c = c.parentId ? byId.get(c.parentId) : undefined
    )
      keep.add(c.id)
  }
  return keep
}

/**
 * One kind's categories active on `date` (CAT-04), as children by parent in the chosen
 * order, for `CategoryTree`. While searching, only the matches and their parents, and
 * `open` lists the branches to show them.
 */
export function categoryChildren(
  categories: ReadonlyArray<Category>,
  {
    kind,
    query,
    sort,
    locale,
    date,
  }: {
    kind: Kind
    query: string
    sort: CategorySort
    locale: string
    date: string
  },
): {
  childrenOf: ReadonlyMap<string | null, ReadonlyArray<Category>>
  open: ReadonlySet<string> | null
} {
  const ofKind = categories.filter(
    (c) => c.kind === kind && isActiveOn(c, date),
  )
  const q = foldForSearch(query.trim())
  const keep = q ? withParents(ofKind, q) : null
  const shown = keep ? ofKind.filter((c) => keep.has(c.id)) : ofKind
  return {
    childrenOf: sortSiblings(childrenByParent(shown, locale), sort, locale),
    open: keep,
  }
}

/** CAT-06: the frequent ones still active on `date`, most used first. */
export function frequentCategories(
  categories: ReadonlyArray<Category>,
  ids: ReadonlyArray<string>,
  date: string,
): Array<Category> {
  const byId = new Map(categories.map((c) => [c.id, c]))
  return ids.flatMap((id) => {
    const category = byId.get(id)
    return category && isActiveOn(category, date) ? [category] : []
  })
}
