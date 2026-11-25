import { typeLabel } from '#/lib/accounts/account'
import { inLocale } from '#/i18n/locales'
import { sumAmounts } from '#/lib/net-worth/net-worth'
import { ITEM_GROUPS, chartItemLabel } from '#/lib/net-worth/net-worth-series'
import { compareNames, newestFirst } from '#/lib/shared/collections'
import { compareDecimal, negateDecimal } from '#/lib/shared/money'
import type { Account, AccountsPage } from '#/lib/accounts/account'
import type { Holding, HoldingsPage } from '#/lib/holdings/holding'
import type { Institution } from '#/lib/institutions/institution'
import type { Locale } from '#/i18n/locales'
import type { ChartItem, ItemGroup } from '#/lib/net-worth/net-worth-series'

// The hub's one list of accounts and holdings (spec 20, ADR-061): grouped by type or by
// institution, sorted as ACC-07, each with its own value and what it adds to the total.

const ZERO = '0.0000'

export const NET_WORTH_SORTS = [
  'name',
  'type',
  'currency',
  'valueAsc',
  'valueDesc',
] as const
export type NetWorthSort = (typeof NET_WORTH_SORTS)[number]

export const GROUP_BYS = ['type', 'institution'] as const
export type GroupBy = (typeof GROUP_BYS)[number]

/** The key of the group of items with no institution. */
export const NO_INSTITUTION_KEY = ''

type EntryBase = {
  id: string
  group: ItemGroup
  /** With the institution, as items are named outside their institution's group. */
  label: string
  /** Inside the institution's group. */
  shortLabel: string
  typeText: string
  currency: string
  institutionId: string | null
  closedOn: string | null
  /** In its own currency; a debt as owed. 0 with no value yet. */
  value: string
  /** In the display currency, debts negative: what it adds. Null when a rate is missing. */
  worth: string | null
}

export type NetWorthEntry = EntryBase &
  (
    | { type: 'account'; account: Account }
    | {
        type: 'holding'
        /** `label` as the holding's actions name it. */
        holding: Holding & { label: string }
      }
  )

/** A holding with no value yet adds nothing; a debt subtracts. */
function holdingWorth(holding: Holding): string | null {
  if (holding.latestOn === null) return ZERO
  if (holding.displayValue === null || holding.kind !== 'debt')
    return holding.displayValue
  return negateDecimal(holding.displayValue)
}

/** Every account and holding the hub knows, open and archived. */
export function netWorthEntries({
  accounts,
  holdings,
  items,
  locale,
}: {
  accounts: AccountsPage
  holdings: HoldingsPage
  items: ReadonlyArray<ChartItem>
  locale: Locale
}): Array<NetWorthEntry> {
  const byId = new Map(items.map((i) => [i.id, i]))
  const types = new Map(accounts.types.map((type) => [type.code, type]))
  const labels = (id: string, fallback: string) => {
    const item = byId.get(id)
    return item
      ? {
          label: chartItemLabel(item, locale),
          shortLabel: chartItemLabel(item, locale, true),
        }
      : { label: fallback, shortLabel: fallback }
  }
  const fromAccounts = accounts.accounts.map((account): NetWorthEntry => {
    const group = byId.get(account.id)?.group ?? 'accounts'
    const type = types.get(account.type)
    return {
      type: 'account',
      account,
      id: account.id,
      group,
      ...labels(account.id, account.name),
      typeText: type ? typeLabel(type, locale) : account.type,
      currency: account.currency,
      institutionId: account.institutionId,
      closedOn: account.closedOn,
      // A credit card's balance is negative; with the debts it reads as owed.
      value:
        group === 'debts' ? negateDecimal(account.balance) : account.balance,
      worth: account.displayBalance,
    }
  })
  const fromHoldings = holdings.holdings.map((holding): NetWorthEntry => {
    const names = labels(holding.id, holding.typeFr)
    return {
      type: 'holding',
      holding: { ...holding, label: names.label },
      id: holding.id,
      group: byId.get(holding.id)?.group ?? 'investments',
      ...names,
      typeText: inLocale(locale, holding.typeFr, holding.typeEn),
      currency: holding.currency,
      institutionId: holding.institutionId,
      closedOn: holding.closedOn,
      value: holding.latestValue ?? ZERO,
      worth: holdingWorth(holding),
    }
  })
  return [...fromAccounts, ...fromHoldings]
}

/** ACC-07 for every item: values compare in the display currency; a missing rate sorts last. */
export function entryComparator(
  sort: NetWorthSort,
  locale: string,
  label: (entry: NetWorthEntry) => string,
): (a: NetWorthEntry, b: NetWorthEntry) => number {
  const byName = compareNames(locale)
  const named = (a: NetWorthEntry, b: NetWorthEntry) =>
    byName({ name: label(a) }, { name: label(b) })
  const byValue = (a: NetWorthEntry, b: NetWorthEntry, direction: number) => {
    if (a.worth === null || b.worth === null)
      return Number(a.worth === null) - Number(b.worth === null)
    return direction * compareDecimal(a.worth, b.worth)
  }
  const compare: Record<
    NetWorthSort,
    (a: NetWorthEntry, b: NetWorthEntry) => number
  > = {
    name: named,
    type: (a, b) => a.typeText.localeCompare(b.typeText, locale) || named(a, b),
    currency: (a, b) => a.currency.localeCompare(b.currency) || named(a, b),
    valueAsc: (a, b) => byValue(a, b, 1) || named(a, b),
    valueDesc: (a, b) => byValue(a, b, -1) || named(a, b),
  }
  return compare[sort]
}

export type EntryGroup = { key: string; entries: Array<NetWorthEntry> } & (
  | { by: 'type'; group: ItemGroup }
  | { by: 'institution'; institution: Institution | null }
)

/**
 * The open items in groups: by type in the chart's order, or by institution A to Z then
 * the ones with none. Empty groups are left out.
 */
export function groupEntries(
  entries: ReadonlyArray<NetWorthEntry>,
  {
    by,
    sort,
    locale,
    institutions,
  }: {
    by: GroupBy
    sort: NetWorthSort
    locale: string
    institutions: ReadonlyArray<Institution>
  },
): Array<EntryGroup> {
  const open = entries.filter((e) => !e.closedOn)
  if (by === 'type') {
    const compare = entryComparator(sort, locale, (e) => e.label)
    return ITEM_GROUPS.flatMap((group) => {
      const members = open.filter((e) => e.group === group).sort(compare)
      return members.length > 0
        ? [{ by: 'type' as const, key: group, group, entries: members }]
        : []
    })
  }
  const compare = entryComparator(sort, locale, (e) => e.shortLabel)
  const byName = compareNames(locale)
  const named = [...institutions].sort(byName).flatMap((institution) => {
    const members = open
      .filter((e) => e.institutionId === institution.id)
      .sort(compare)
    return members.length > 0
      ? [
          {
            by: 'institution' as const,
            key: institution.id,
            institution,
            entries: members,
          },
        ]
      : []
  })
  const rest = open.filter((e) => !e.institutionId).sort(compare)
  return rest.length > 0
    ? [
        ...named,
        {
          by: 'institution',
          key: NO_INSTITUTION_KEY,
          institution: null,
          entries: rest,
        },
      ]
    : named
}

/** What a group adds to the net worth, without the hidden items; `NO_FIGURE` on a missing rate. */
export function groupWorth(
  entries: ReadonlyArray<NetWorthEntry>,
  hidden: ReadonlySet<string>,
): string | null {
  return sumAmounts(
    entries.filter((e) => !hidden.has(e.id)).map((e) => e.worth),
  )
}

/** The archived items, the last archived first, then A to Z. */
export function closedEntries(
  entries: ReadonlyArray<NetWorthEntry>,
  locale: string,
): Array<NetWorthEntry> {
  const byName = compareNames(locale)
  const byDate = newestFirst((e: NetWorthEntry) => e.closedOn)
  return entries
    .filter((e) => e.closedOn)
    .sort(
      (a, b) => byDate(a, b) || byName({ name: a.label }, { name: b.label }),
    )
}
