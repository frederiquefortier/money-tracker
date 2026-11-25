import {
  categoryPath,
  childrenByParent,
  descendantIds,
  isArchived,
} from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import { indexById, newestFirst } from '#/lib/shared/collections'

// How a category sits among the others: its archived branches and its row context.

/**
 * CAT-05: archived categories as a tree. One whose parent is still active starts a branch
 * at the top, where it shows with its path. The roots go the last archived first, then in
 * path order.
 */
export function archivedTree(
  archived: ReadonlyArray<Category>,
  byId: ReadonlyMap<string, Category>,
  locale: string,
) {
  const ids = new Set(archived.map((c) => c.id))
  const underArchived = (c: Category) =>
    c.parentId !== null && ids.has(c.parentId)
  const children = childrenByParent(archived.filter(underArchived), locale)
  const byDate = newestFirst((c: Category) => c.history[0]?.effectiveOn)
  children.set(
    null,
    archived
      .filter((c) => !underArchived(c))
      .map((category) => ({ category, path: categoryPath(category, byId) }))
      .sort(
        (a, b) =>
          byDate(a.category, b.category) ||
          a.path.localeCompare(b.path, locale),
      )
      .map(({ category }) => category),
  )
  return children
}

/** Archived parents, from the top down, that come back with a reactivated category. */
export function archivedParents(
  category: Category,
  byId: ReadonlyMap<string, Category>,
) {
  const found: Array<Category> = []
  for (
    let p = category.parentId ? byId.get(category.parentId) : undefined;
    p && isArchived(p);
    p = p.parentId ? byId.get(p.parentId) : undefined
  )
    found.unshift(p)
  return found
}

/**
 * What a category's actions need from the rest of the tree: its parent, whether it has
 * children (delete waits), how many active sub-categories archiving takes along, and the
 * archived parents reactivating brings back.
 */
export function categoryContext(
  categories: ReadonlyArray<Category>,
  locale: string,
) {
  const byId = indexById(categories)
  const children = childrenByParent(categories, locale)
  return (category: Category) => ({
    parent: category.parentId ? byId.get(category.parentId) : undefined,
    hasChildren: children.has(category.id),
    branch: [...descendantIds(category.id, children)].filter((id) => {
      const c = byId.get(id)
      return c !== undefined && !isArchived(c)
    }).length,
    archivedParents: archivedParents(category, byId),
  })
}
