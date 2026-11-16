import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { Icon } from '#/components/display/icon'
import { focusRing } from '#/components/styles'
import { accountLabel } from '#/lib/accounts/account'
import type {
  ListFilters,
  PeriodChoice,
} from '#/lib/transactions/transaction-list'
import { usePeriodLabel } from '#/hooks/transactions/use-period-label'
import {
  FILTER_KEYS,
  FILTER_TABS,
  NO_FILTERS,
} from '#/lib/transactions/transaction-filters'
import type {
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import { cn } from '#/lib/utils'

type Picked = { id: string; name: string; icon?: React.ReactNode }

function namedIn(
  tab: Exclude<FilterTab, 'kinds'>,
  names: ListFilters,
): Array<Picked> {
  if (tab === 'accounts')
    return names.accounts.map((a) => ({ id: a.id, name: accountLabel(a) }))
  if (tab === 'categories')
    return names.categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: (
        <CategoryBadge
          icon={c.icon}
          color={c.color}
          size="sm"
          className="size-6 [&_svg]:size-3.5"
        />
      ),
    }))
  return names[tab]
}

/** What is ticked in a filter, by name, as far as the list has named it; a kind by its label. */
export function usePickedOf() {
  const { t } = useTranslation()
  return (
    tab: FilterTab,
    names: ListFilters | null,
    values: FilterValues,
  ): Array<Picked> => {
    if (tab === 'kinds')
      return values.kinds.map((kind) => ({
        id: kind,
        name: t(`transactions.kinds.${kind}`),
      }))
    if (!names) return []
    const ticked = new Set<string>(values[FILTER_KEYS[tab]])
    return namedIn(tab, names).filter((one) => ticked.has(one.id))
  }
}

function Chip({
  name,
  icon,
  capitalize = false,
  removeLabel,
  onRemove,
}: {
  name: string
  icon?: React.ReactNode
  /** For a date written in lower case ("novembre 2026"); a typed name is left as it is. */
  capitalize?: boolean
  removeLabel: string
  onRemove: () => void
}) {
  return (
    <span
      className={cn(
        'inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-primary bg-accent pr-1 pl-3 text-sm font-semibold text-accent-foreground',
        icon && 'pl-1',
      )}
    >
      {icon}
      <span className={cn('truncate', capitalize && 'first-letter:uppercase')}>
        {name}
      </span>
      <button
        type="button"
        aria-label={removeLabel}
        title={removeLabel}
        onClick={onRemove}
        className={cn(
          'grid size-6 shrink-0 place-items-center rounded-full hover:bg-primary/15',
          focusRing,
        )}
      >
        <Icon name="close" className="size-4" />
      </button>
    </span>
  )
}

/**
 * What is chosen, under the bubbles (ADR-029): the period first (unless it is Tout), then a chip per value with a ✕, however many, and Tout effacer. Nothing renders while nothing is chosen.
 */
export function FilterChips({
  values,
  names,
  period,
  onChange,
}: {
  values: FilterValues
  names: ListFilters | null
  /** The list's period (ADR-031): a chip first, unless it is Tout. */
  period?: { choice: PeriodChoice; onChange: (choice: PeriodChoice) => void }
  onChange: (values: FilterValues) => void
}) {
  const { t } = useTranslation()
  const periodLabel = usePeriodLabel()
  const pickedOf = usePickedOf()
  const toAll = (choice: PeriodChoice) => ({
    ...choice,
    period: 'all' as const,
  })
  const chips = FILTER_TABS.flatMap((tab) => {
    const key = FILTER_KEYS[tab]
    const picked = pickedOf(tab, names, values)
    const without = (ids: ReadonlyArray<string>) =>
      onChange({
        ...values,
        [key]: values[key].filter((id) => !ids.includes(id)),
      })
    return picked.map((one) => (
      <Chip
        key={`${tab}-${one.id}`}
        name={one.name}
        icon={one.icon}
        removeLabel={t('transactions.list.remove', { name: one.name })}
        onRemove={() => without([one.id])}
      />
    ))
  })
  if (period && period.choice.period !== 'all')
    chips.unshift(
      <Chip
        key="period"
        name={periodLabel(period.choice)}
        capitalize
        removeLabel={t('transactions.list.remove', {
          name: periodLabel(period.choice),
        })}
        onRemove={() => period.onChange(toAll(period.choice))}
      />,
    )
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips}
      <button
        type="button"
        onClick={() => {
          onChange(NO_FILTERS)
          if (period) period.onChange(toAll(period.choice))
        }}
        className={cn(
          'h-8 rounded-full px-2 text-sm font-semibold text-muted-foreground hover:text-foreground',
          focusRing,
        )}
      >
        {t('transactions.list.clearAll')}
      </button>
    </div>
  )
}
