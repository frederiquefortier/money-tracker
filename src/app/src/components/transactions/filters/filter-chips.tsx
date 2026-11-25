import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { focusRing } from '#/components/styles'
import { usePickedOf } from '#/hooks/transactions/use-picked-of'
import type { ListFilters } from '#/lib/transactions/transaction-list'
import {
  FILTER_KEYS,
  FILTER_TABS,
} from '#/lib/transactions/transaction-filters'
import type { FilterValues } from '#/lib/transactions/transaction-filters'
import { cn } from '#/lib/utils'

function Chip({
  name,
  icon,
  removeLabel,
  onRemove,
}: {
  name: string
  icon?: React.ReactNode
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
      <span className="truncate">{name}</span>
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
 * What is chosen, under the bubbles (ADR-029): a chip per value with a ✕, however many, at
 * every width (the sidebar shows only counts). No Tout effacer beside them (the sheet and
 * the sidebar have one), and the period is on the tabs, not a chip.
 * Nothing renders while nothing is chosen.
 */
export function FilterChips({
  values,
  names,
  onChange,
}: {
  values: FilterValues
  names: ListFilters | null
  onChange: (values: FilterValues) => void
}) {
  const { t } = useTranslation()
  const pickedOf = usePickedOf()
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
  if (chips.length === 0) return null
  return <div className="flex flex-wrap items-center gap-2">{chips}</div>
}
