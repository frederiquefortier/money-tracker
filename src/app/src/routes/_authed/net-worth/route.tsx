import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChoiceMenu } from '#/components/display/choice-menu'
import { FormAlert } from '#/components/forms/form-field'
import { FloatingAddButton } from '#/components/layout/floating-add-button'
import { ListPage } from '#/components/layout/list-page'
import { listPagePending } from '#/components/layout/page-pending'
import { ExpandAllButton } from '#/components/lists/expand-all-button'
import { SortMenu } from '#/components/lists/sort-menu'
import { ItemList } from '#/components/net-worth/item-list'
import { NetWorthDashboard } from '#/components/net-worth/net-worth-dashboard'
import { NetWorthSkeleton } from '#/components/net-worth/net-worth-skeleton'
import { focusRing } from '#/components/styles'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { useLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { useCollapsedGroups } from '#/hooks/net-worth/use-collapsed-groups'
import { useNetWorthChart } from '#/hooks/net-worth/use-net-worth-chart'
import {
  GROUP_BYS,
  NET_WORTH_SORTS,
  groupEntries,
  netWorthEntries,
} from '#/lib/net-worth/net-worth-list'
import type { GroupBy, NetWorthSort } from '#/lib/net-worth/net-worth-list'
import { oneOf } from '#/lib/shared/collections'
import { cn } from '#/lib/utils'
import { getAccounts } from '#/server/accounts'
import { getHoldings } from '#/server/holdings'
import { getNetWorth } from '#/server/net-worth'

// The hub and every account and holding in one page (ADR-061). The forms open as sheets
// over it, under /net-worth/accounts/… and /net-worth/holdings/….
export const Route = createFileRoute('/_authed/net-worth')({
  ...listPagePending((t) => t('netWorth.title'), {
    wide: 'xl',
    body: NetWorthSkeleton,
  }),
  loader: async () => {
    const [netWorth, accounts, holdings] = await Promise.all([
      getNetWorth(),
      getAccounts(),
      getHoldings(),
    ])
    return { ...netWorth, accounts, holdings }
  },
  component: NetWorthHub,
})

const parseSort = oneOf(NET_WORTH_SORTS)
const parseGroupBy = oneOf(GROUP_BYS)

function AddMenu() {
  const { t } = useTranslation()
  return (
    <FloatingAddButton
      label={t('common.add')}
      options={[
        {
          to: '/net-worth/accounts/new',
          label: t('accounts.addAccount'),
          icon: 'wallet',
        },
        {
          to: '/net-worth/holdings/new',
          label: t('holdings.addHolding'),
          icon: 'coins',
        },
        {
          to: '/net-worth/accounts/adjust',
          label: t('transactions.adjustment.newTitle'),
          icon: 'scale',
        },
      ]}
    />
  )
}

/** Investment transactions that name no holding, as a tag beside the title. */
function Unlinked({
  count,
  categoryIds,
}: {
  count: number
  categoryIds: Array<string>
}) {
  const { t } = useTranslation()
  if (count === 0) return null
  return (
    <Link
      to="/transactions"
      search={{ category: categoryIds }}
      className={cn('block w-fit max-w-full rounded-full', focusRing)}
    >
      <FormAlert
        tone="warning"
        size="tag"
        className="w-fit max-w-full hover:bg-warning/25"
      >
        {t('holdings.unlinked', { count })}
      </FormAlert>
    </Link>
  )
}

/** How the list is grouped and sorted, both remembered per browser. */
function ListChoices({
  groupBy,
  onGroupBy,
  sort,
  onSort,
}: {
  groupBy: GroupBy
  onGroupBy: (groupBy: GroupBy) => void
  sort: NetWorthSort
  onSort: (sort: NetWorthSort) => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <ChoiceMenu
        label={t('netWorth.groupByLabel', {
          groupBy: t(`netWorth.groupBy.${groupBy}`),
        })}
        value={groupBy}
        options={GROUP_BYS}
        labelOf={(option) => t(`netWorth.groupBy.${option}`)}
        onChange={onGroupBy}
      />
      <SortMenu
        sort={sort}
        options={NET_WORTH_SORTS}
        labelOf={(option) => t(`netWorth.sort.${option}`)}
        onChange={onSort}
      />
    </>
  )
}

function NetWorthHub() {
  const { t } = useTranslation()
  const locale = useLocale()
  const data = Route.useLoaderData()
  const { displayCurrency, series, items, flows, accounts, holdings } = data
  const chart = useNetWorthChart(series, items, flows)
  const [sort, setSort] = useStoredState<NetWorthSort>(
    'netWorth.sort',
    'name',
    parseSort,
  )
  const [groupBy, setGroupBy] = useStoredState<GroupBy>(
    'netWorth.groupBy',
    'type',
    parseGroupBy,
  )
  const collapsed = useCollapsedGroups(data.collapsed)

  const entries = useMemo(
    () => netWorthEntries({ accounts, holdings, items, locale }),
    [accounts, holdings, items, locale],
  )
  const groups = groupEntries(entries, {
    by: groupBy,
    sort,
    locale: FORMAT_LOCALE[locale],
    institutions: accounts.institutions,
  })
  const keys = groups.map((group) => group.key)
  const allExpanded = keys.every((key) => !collapsed.ids.has(key))

  return (
    <ListPage
      title={t('netWorth.title')}
      count={entries.length}
      wide="xl"
      titleNote={
        <Unlinked
          count={holdings.unlinkedCount}
          categoryIds={holdings.investmentCategoryIds}
        />
      }
    >
      <NetWorthDashboard
        chart={chart}
        total={data.total}
        currency={displayCurrency}
        converted={data.converted}
        items={items}
        controls={
          <>
            {keys.length > 0 && (
              <ExpandAllButton
                allExpanded={allExpanded}
                onToggle={() => collapsed.setAll(keys, allExpanded)}
              />
            )}
            <ListChoices
              groupBy={groupBy}
              onGroupBy={setGroupBy}
              sort={sort}
              onSort={setSort}
            />
          </>
        }
        list={
          <ItemList
            entries={entries}
            groups={groups}
            chart={chart}
            currency={displayCurrency}
            collapsed={collapsed.ids}
            onToggle={collapsed.toggle}
          />
        }
      />
      <AddMenu />
      {/* The account and holding forms open here as sheets, over the hub. */}
      <Outlet />
    </ListPage>
  )
}
