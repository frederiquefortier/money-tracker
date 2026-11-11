import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckList } from '#/components/forms/check-list'
import type { CheckNode } from '#/components/forms/check-list'
import {
  groupTicks,
  categoryTicks,
  merchantNodes,
} from '#/components/forms/check-ticks'
import { Button } from '#/components/ui/button'
import { todayIso } from '#/lib/shared/format'
import type { Merchant } from '#/lib/merchants/merchant'
import { useFormatLocale } from '#/hooks/app/use-locale'
import {
  useAccountTree,
  useCategoryTree,
  useEventTree,
  usePeopleTree,
} from '#/hooks/transactions/use-check-trees'
import type {
  FilterOptions,
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'

// The filter sheet's lists, one per tab.

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
  // Ticked first as the tab opened: a tick never moves its row under the finger.
  const [pickedAtOpen] = useState(picked)
  const { nodes, more } = merchantNodes(merchants, {
    query,
    picked: pickedAtOpen,
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

/** Events in two cards, current open and past folded, after the choice of none. */
function EventList({
  options,
  query,
  values,
  onChange,
}: {
  options: FilterOptions
  query: string
  values: FilterValues
  onChange: (values: FilterValues) => void
}) {
  const events = useEventTree(
    { events: options.events, types: options.eventTypes },
    query,
    todayIso(),
  )
  const ticks = groupTicks(values.eventIds)
  const toggle = (node: CheckNode) =>
    onChange({ ...values, eventIds: ticks.toggle(node) })
  if (events.length === 0) return <NoMatch />
  return (
    <CheckList
      nodes={events}
      openCount={1}
      stateOf={ticks.stateOf}
      onToggle={toggle}
    />
  )
}

/**
 * The open tab's list: accounts by institution, the categories tree by type, merchants,
 * people by group.
 */
export function FilterList({
  tab,
  query,
  options,
  values,
  onChange,
}: {
  tab: FilterTab
  query: string
  options: FilterOptions
  values: FilterValues
  onChange: (values: FilterValues) => void
}) {
  const accounts = useAccountTree(options.accounts, query)
  const categories = useCategoryTree(options.categories, query)
  const people = usePeopleTree(options.people, options.groups, query)
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
  if (tab === 'people') {
    const ticks = groupTicks(values.personIds)
    if (!people.length) return <NoMatch />
    return (
      <CheckList
        nodes={people}
        openCount={people.length}
        stateOf={ticks.stateOf}
        onToggle={(node) =>
          onChange({ ...values, personIds: ticks.toggle(node) })
        }
      />
    )
  }
  if (tab === 'events')
    return (
      <EventList
        options={options}
        query={query}
        values={values}
        onChange={onChange}
      />
    )
  return (
    <MerchantList
      merchants={options.merchants}
      query={query}
      picked={values.merchantIds}
      onChange={(ids) => onChange({ ...values, merchantIds: ids })}
    />
  )
}
