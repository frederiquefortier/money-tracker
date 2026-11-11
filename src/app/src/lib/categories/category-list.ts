import {
  childrenByParent,
  isActiveOn,
  sortSiblings,
} from '#/lib/categories/category'
import type {
  Category,
  CategorySort,
  CategoryKind,
} from '#/lib/categories/category'
import { indexById } from '#/lib/shared/collections'
import { foldForSearch, matcher } from '#/lib/shared/search'

// The transaction form's category list: one type's tree, as on Catégories.

/**
 * The ids of the categories whose name matches the folded query `q`, with their parents
 * so each keeps its place in the tree. `byId` finds parents outside `categories`.
 */
export function matchesWithParents(
  categories: ReadonlyArray<Category>,
  q: string,
  byId: ReadonlyMap<string, Category> = indexById(categories),
): Set<string> {
  const matches = matcher(q)
  const keep = new Set<string>()
  for (const category of categories) {
    if (!matches(category.name)) continue
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
    kind: CategoryKind
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
  const q = foldForSearch(query)
  const keep = q ? matchesWithParents(ofKind, q) : null
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
  const byId = indexById(categories)
  return ids.flatMap((id) => {
    const category = byId.get(id)
    return category && isActiveOn(category, date) ? [category] : []
  })
}
