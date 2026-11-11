import { z } from 'zod'
import { compareNames } from '#/lib/shared/collections'
import { foldForSearch } from '#/lib/shared/search'
import { nameFormSchema } from '#/lib/shared/validation'

// Shared by the Marchands screens and the server functions (spec 13).

export type Merchant = {
  id: string
  name: string
  defaultCategoryId: string | null
  aliases: Array<string>
  transactionCount: number
}

export const merchantInputSchema = nameFormSchema.extend({
  id: z.uuid().optional(),
  defaultCategoryId: z.uuid().nullable(),
  aliases: z.array(z.string().trim().min(1).max(100)).default([]),
})
export type MerchantInput = z.input<typeof merchantInputSchema>

export const MERCHANT_SORTS = ['nameAsc', 'nameDesc', 'category'] as const
export type MerchantSort = (typeof MERCHANT_SORTS)[number]

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

/** Those whose default category is one of `categoryIds` or below it; all when none. */
export function filterMerchants(
  merchants: ReadonlyArray<Merchant>,
  categoryIds: ReadonlyArray<string>,
  tree: Pick<Tree, 'parentOf'>,
) {
  if (categoryIds.length === 0) return [...merchants]
  return merchants.filter(
    (m) =>
      m.defaultCategoryId !== null &&
      withAncestors(m.defaultCategoryId, tree).some((id) =>
        categoryIds.includes(id),
      ),
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
  const byName = compareNames(locale)
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

/** Most used first, then by name: the order of every merchant choice (TRX-05). */
export function compareByUse(locale: string) {
  const byName = compareNames(locale)
  return (a: Merchant, b: Merchant) =>
    b.transactionCount - a.transactionCount || byName(a, b)
}

/**
 * The names and aliases a merchant's alias cannot take, folded: every other merchant's
 * (an import match must point to one merchant only, MER-02).
 */
export function takenMerchantNames(
  merchants: ReadonlyArray<Merchant>,
  merchantId: string | undefined,
) {
  return new Set(
    merchants
      .filter((m) => m.id !== merchantId)
      .flatMap((m) => [m.name, ...m.aliases])
      .map(foldForSearch),
  )
}

export type MerchantError = 'nameTaken' | 'aliasTaken' | 'notFound' | 'failed'
