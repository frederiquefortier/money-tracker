import { compareNames } from '#/lib/shared/collections'
import { compareDecimal } from '#/lib/shared/money'
import type { ListedHolding } from '#/lib/holdings/holding'
import type { Institution } from '#/lib/institutions/institution'

/** The holdings of one institution, or of none (`institution` null). */
export type HoldingDrawer = {
  key: string
  institution: Institution | null
  holdings: Array<ListedHolding>
}

/** The key of the drawer of holdings with no institution. */
export const NO_INSTITUTION_KEY = ''

export const HOLDING_SORTS = [
  'name',
  'type',
  'currency',
  'valueAsc',
  'valueDesc',
] as const
export type HoldingSort = (typeof HOLDING_SORTS)[number]

/**
 * Spec 19, as the accounts' sort (ACC-07). Values compare in the display currency, a debt
 * below zero as the row shows it; a missing rate sorts last.
 */
export function holdingComparator(
  sort: HoldingSort,
  locale: string,
): (a: ListedHolding, b: ListedHolding) => number {
  const byName = compareNames(locale)
  const named = (a: ListedHolding, b: ListedHolding) =>
    byName({ name: a.label }, { name: b.label })
  const signed = (h: ListedHolding) =>
    h.displayValue !== null && h.kind === 'debt' && h.displayValue !== '0.0000'
      ? `-${h.displayValue}`
      : h.displayValue
  const byValue = (a: ListedHolding, b: ListedHolding, direction: number) => {
    const [x, y] = [signed(a), signed(b)]
    if (x === null || y === null) return Number(x === null) - Number(y === null)
    return direction * compareDecimal(x, y)
  }
  const compare: Record<
    HoldingSort,
    (a: ListedHolding, b: ListedHolding) => number
  > = {
    name: named,
    type: (a, b) => a.typeText.localeCompare(b.typeText, locale) || named(a, b),
    currency: (a, b) => a.currency.localeCompare(b.currency) || named(a, b),
    valueAsc: (a, b) => byValue(a, b, 1) || named(a, b),
    valueDesc: (a, b) => byValue(a, b, -1) || named(a, b),
  }
  return compare[sort]
}

/** Open holdings in drawers by institution, A to Z, then the ones with none (spec 19). */
export function drawersOf(
  holdings: ReadonlyArray<ListedHolding>,
  institutions: ReadonlyArray<Institution>,
  {
    compare,
    compareHoldings,
  }: {
    /** Orders the institutions. */
    compare: (a: { name: string }, b: { name: string }) => number
    /** Orders the holdings in a drawer. */
    compareHoldings: (a: ListedHolding, b: ListedHolding) => number
  },
): Array<HoldingDrawer> {
  const named = institutions
    .map((institution) => ({
      key: institution.id,
      institution,
      holdings: holdings
        .filter((h) => h.institutionId === institution.id)
        .sort(compareHoldings),
    }))
    .filter((drawer) => drawer.holdings.length > 0)
    .sort((a, b) => compare(a.institution, b.institution))
  const rest = holdings.filter((h) => !h.institutionId).sort(compareHoldings)
  return rest.length > 0
    ? [...named, { key: NO_INSTITUTION_KEY, institution: null, holdings: rest }]
    : named
}
