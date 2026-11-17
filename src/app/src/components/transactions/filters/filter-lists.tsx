import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckList } from '#/components/forms/check-list'
import type { CheckNode } from '#/components/forms/check-list'
import {
  groupTicks,
  categoryTicks,
  merchantNodes,
} from '#/components/forms/check-ticks'
import { useRevealed } from '#/hooks/app/use-revealed'
import { todayIso } from '#/lib/shared/format'
import type { Merchant } from '#/lib/merchants/merchant'
import { useFormatLocale } from '#/hooks/app/use-locale'
import {
  useAccountTree,
  useCategoryTree,
  useEventTree,
  usePeopleTree,
} from '#/hooks/transactions/use-check-trees'
import { isOneOf } from '#/lib/shared/collections'
import { FILTER_KINDS } from '#/lib/transactions/transaction-filters'
import type {
  FilterOptions,
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'

// The filter sheet's lists, one per tab.

const isKind = isOneOf(FILTER_KINDS)

function NoMatch() {
  const { t } = useTranslation()
  return <p className="text-muted-foreground">{t('common.noMatch')}</p>
}

// Enough to fill the sheet; more build as the list nears the end, as every long list does.
const MERCHANTS_STEP = 40

/** Merchants can run to thousands: the most used first, built as they near the screen. */
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
  const locale = useFormatLocale()
  // Ticked first as the tab opened: a tick never moves its row under the finger.
  const [pickedAtOpen] = useState(picked)
  const nodes = merchantNodes(merchants, {
    query,
    picked: pickedAtOpen,
    locale,
  })
  const { shown, more, sentinel } = useRevealed(nodes, MERCHANTS_STEP)
  const ticks = groupTicks(picked)
  if (!nodes.length) return <NoMatch />
  return (
    <CheckList
      nodes={shown}
      stateOf={ticks.stateOf}
      onToggle={(node) => onChange(ticks.toggle(node))}
    >
      {more && <div ref={sentinel} aria-hidden="true" />}
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
  return <CheckList nodes={events} stateOf={ticks.stateOf} onToggle={toggle} />
}

/** Dépense, Revenu, Transfert: an adjustment is in none of them. */
function KindList({
  values,
  onChange,
}: {
  values: FilterValues
  onChange: (values: FilterValues) => void
}) {
  const { t } = useTranslation()
  const ticks = groupTicks(values.kinds)
  const nodes = FILTER_KINDS.map((kind) => ({
    id: kind,
    label: t(`transactions.kinds.${kind}`),
  }))
  return (
    <CheckList
      nodes={nodes}
      stateOf={ticks.stateOf}
      onToggle={(node) =>
        onChange({ ...values, kinds: ticks.toggle(node).filter(isKind) })
      }
    />
  )
}

/**
 * The open tab's list: the kinds, accounts by institution, the categories tree by type, merchants,
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
  if (tab === 'kinds') return <KindList values={values} onChange={onChange} />
  if (tab === 'accounts') {
    const ticks = groupTicks(values.accountIds)
    if (!accounts.length) return <NoMatch />
    return (
      <CheckList
        nodes={accounts}
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
