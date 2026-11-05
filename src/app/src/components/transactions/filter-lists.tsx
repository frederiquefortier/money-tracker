import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckList } from '#/components/check-list'
import {
  groupTicks,
  categoryTicks,
  merchantNodes,
  useAccountTree,
  useCategoryTree,
} from '#/components/transactions/filter-nodes'
import type {
  FilterTab,
  FilterValues,
} from '#/components/transactions/filter-sheet'
import { Button } from '#/components/ui/button'
import type { Category } from '#/lib/categories'
import type { Merchant } from '#/lib/merchants'
import type { FormAccount } from '#/lib/transactions'
import { useFormatLocale } from '#/lib/use-locale'

// The filter sheet's three lists, one per tab (spec 14).

export type Options = {
  accounts: Array<FormAccount>
  categories: Array<Category>
  merchants: Array<Merchant>
}

function NoMatch() {
  const { t } = useTranslation()
  return <p className="text-muted-foreground">{t('common.noMatch')}</p>
}

// The few most used first; the search reaches all of them.
const MERCHANTS_FIRST = 8
const MERCHANTS_MORE = 50

// Institutions open at first while they all fit on a phone.
const ACCOUNT_GROUPS_OPEN = 4

/** Merchants can run to thousands: a few at a time, the search reaching all of them. */
function MerchantList({
  merchants,
  query,
  picked,
  onChange,
}: {
  merchants: ReadonlyArray<Merchant>
  query: string
  picked: ReadonlyArray<string>
  onChange: (ids: Array<string>) => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const [shown, setShown] = useState(MERCHANTS_FIRST)
  const { nodes, more } = merchantNodes(merchants, {
    query,
    picked,
    shown,
    locale,
  })
  const ticks = groupTicks(picked)
  if (!nodes.length) return <NoMatch />
  return (
    <CheckList
      nodes={nodes}
      stateOf={ticks.stateOf}
      onToggle={(node) => onChange(ticks.toggle(node))}
    >
      {more && (
        <div className="border-t px-1 py-1">
          <Button
            variant="ghost"
            onClick={() => setShown(shown + MERCHANTS_MORE)}
          >
            {t('transactions.list.showMore')}
          </Button>
        </div>
      )}
    </CheckList>
  )
}

/** The open tab's list: accounts by institution, the categories tree by type, merchants. */
export function FilterList({
  tab,
  query,
  options,
  values,
  onChange,
}: {
  tab: FilterTab
  query: string
  options: Options
  values: FilterValues
  onChange: (values: FilterValues) => void
}) {
  const accounts = useAccountTree(options.accounts, query)
  const categories = useCategoryTree(options.categories, query)
  if (tab === 'accounts') {
    const ticks = groupTicks(values.accountIds)
    if (!accounts.length) return <NoMatch />
    return (
      <CheckList
        nodes={accounts}
        openCount={accounts.length <= ACCOUNT_GROUPS_OPEN ? accounts.length : 0}
        stateOf={ticks.stateOf}
        onToggle={(node) =>
          onChange({ ...values, accountIds: ticks.toggle(node) })
        }
      />
    )
  }
  if (tab === 'categories') {
    const ticks = categoryTicks(options.categories, values.categoryIds)
    if (!categories.length) return <NoMatch />
    return (
      <CheckList
        nodes={categories}
        openCount={1}
        stateOf={ticks.stateOf}
        onToggle={(node) =>
          onChange({ ...values, categoryIds: ticks.toggle(node) })
        }
      />
    )
  }
  return (
    <MerchantList
      merchants={options.merchants}
      query={query}
      picked={values.merchantIds}
      onChange={(ids) => onChange({ ...values, merchantIds: ids })}
    />
  )
}
