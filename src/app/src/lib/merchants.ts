import { z } from 'zod'
import { treeOrder } from '#/lib/tree'

// Shared by the Marchands screens and the server functions (spec 13).

export type Merchant = {
  id: string
  name: string
  defaultCategoryId: string | null
  transactionCount: number
}

export const merchantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'required' })
    .max(100, { error: 'invalid' }),
})

export const merchantInputSchema = merchantFormSchema.extend({
  id: z.uuid().optional(),
  defaultCategoryId: z.uuid().nullable(),
})
export type MerchantInput = z.input<typeof merchantInputSchema>

export const MERCHANT_SORTS = ['nameAsc', 'nameDesc', 'category'] as const
export type MerchantSort = (typeof MERCHANT_SORTS)[number]

/** "all", "none" (no default category), or a category id, which keeps its branch too. */
export type MerchantFilter = string

type Tree = {
  pathOf: (categoryId: string) => string | undefined
  parentOf: (categoryId: string) => string | null | undefined
}

function withAncestors(
  categoryId: string,
  { parentOf }: Pick<Tree, 'parentOf'>,
) {
  const ids: Array<string> = []
  for (
    let id: string | null | undefined = categoryId;
    id && !ids.includes(id);
    id = parentOf(id)
  )
    ids.push(id)
  return ids
}

/**
 * The filter's choices with their depth: all, every default category in use and its
 * parents as a tree, then none.
 */
export function merchantFilters(
  merchants: ReadonlyArray<Merchant>,
  categories: ReadonlyArray<{
    id: string
    parentId: string | null
    name: string
  }>,
  locale: string,
): Array<{ value: MerchantFilter; depth: number }> {
  const parentOf = (id: string) => categories.find((c) => c.id === id)?.parentId
  const used = new Set(
    merchants.flatMap((m) =>
      m.defaultCategoryId
        ? withAncestors(m.defaultCategoryId, { parentOf })
        : [],
    ),
  )
  const tree = treeOrder(
    categories.filter((c) => used.has(c.id)),
    locale,
  ).map(({ item, depth }) => ({ value: item.id, depth }))
  const none = merchants.some((m) => !m.defaultCategoryId)
    ? [{ value: 'none', depth: 0 }]
    : []
  return [{ value: 'all', depth: 0 }, ...tree, ...none]
}

export function filterMerchants(
  merchants: ReadonlyArray<Merchant>,
  filter: MerchantFilter,
  tree: Tree,
) {
  if (filter === 'all') return [...merchants]
  if (filter === 'none') return merchants.filter((m) => !m.defaultCategoryId)
  return merchants.filter(
    (m) =>
      m.defaultCategoryId !== null &&
      withAncestors(m.defaultCategoryId, tree).includes(filter),
  )
}

/** By category path, merchants with none last; within a category, by name. */
export function sortMerchants(
  merchants: ReadonlyArray<Merchant>,
  {
    sort,
    pathOf,
    locale,
  }: { sort: MerchantSort; pathOf: Tree['pathOf']; locale: string },
) {
  const byName = (a: Merchant, b: Merchant) =>
    a.name.localeCompare(b.name, locale)
  const path = (m: Merchant) =>
    m.defaultCategoryId ? pathOf(m.defaultCategoryId) : undefined
  const compare: Record<MerchantSort, (a: Merchant, b: Merchant) => number> = {
    nameAsc: byName,
    nameDesc: (a, b) => byName(b, a),
    category: (a, b) => {
      const pa = path(a)
      const pb = path(b)
      if (pa === pb) return byName(a, b)
      if (pa === undefined) return 1
      if (pb === undefined) return -1
      return pa.localeCompare(pb, locale) || byName(a, b)
    },
  }
  return [...merchants].sort(compare[sort])
}
