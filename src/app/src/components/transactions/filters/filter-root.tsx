import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { pickedOf } from '#/components/transactions/filters/filter-chips'
import { cardSurface, focusRing, rowHover } from '#/components/styles'
import { usePeriodLabel } from '#/hooks/transactions/use-period-label'
import { FILTER_KEYS } from '#/lib/transactions/transaction-filters'
import type {
  FilterScreen,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import type {
  ListFilters,
  PeriodChoice,
} from '#/lib/transactions/transaction-list'
import { cn } from '#/lib/utils'

/** What each screen holds: "Tout", the names, or the count while they are unnamed. */
function useSummary(
  values: FilterValues,
  names: ListFilters | null,
  period: PeriodChoice | null,
) {
  const { t } = useTranslation()
  const periodLabel = usePeriodLabel()
  return (screen: FilterScreen) => {
    if (screen === 'period') return period ? periodLabel(period) : ''
    const count = values[FILTER_KEYS[screen]].length
    if (count === 0) return t('transactions.list.all')
    const picked = pickedOf(screen, names, values)
    return picked.length
      ? picked.map((one) => one.name).join(', ')
      : String(count)
  }
}

/** A phone's first level: the period and each filter with what is chosen; a row opens it. */
export function FilterRoot({
  screens,
  values,
  names,
  period,
  onTab,
}: {
  screens: ReadonlyArray<FilterScreen>
  values: FilterValues
  names: ListFilters | null
  period: PeriodChoice | null
  onTab: (screen: FilterScreen) => void
}) {
  const { t } = useTranslation()
  const summaryOf = useSummary(values, names, period)
  return (
    <ul className={cardSurface}>
      {screens.map((tab) => {
        const active =
          tab === 'period'
            ? period?.period !== 'all'
            : values[FILTER_KEYS[tab]].length > 0
        return (
          <li key={tab} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => onTab(tab)}
              className={cn(
                'flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left',
                rowHover,
                focusRing,
              )}
            >
              <span className="font-semibold">
                {t(`transactions.list.${tab}`)}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-right text-sm',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {summaryOf(tab)}
              </span>
              <Icon name="chevron-right" className="text-muted-foreground" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
