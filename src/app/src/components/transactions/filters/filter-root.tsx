import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { usePickedOf } from '#/hooks/transactions/use-picked-of'
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
import { useToast } from '#/hooks/app/use-toast'

/** What each screen holds: "Tout", the names, or the count while they are unnamed. */
function useSummary(
  values: FilterValues,
  names: ListFilters | null,
  period: PeriodChoice | null,
) {
  const { t } = useTranslation()
  const periodLabel = usePeriodLabel()
  const pickedOf = usePickedOf()
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

/**
 * The filters, each with what is chosen; a row opens it. The sidebar shows a count only,
 * the chips naming the values. A filter with nothing to choose from
 * looks disabled and says why when tapped.
 */
export function FilterRoot({
  screens,
  values,
  names,
  period,
  empty,
  countOnly = false,
  onTab,
}: {
  screens: ReadonlyArray<FilterScreen>
  values: FilterValues
  names: ListFilters | null
  period: PeriodChoice | null
  /** Filters with nothing to choose from; they cannot open while nothing is ticked. */
  empty: ReadonlySet<FilterScreen> | null
  /** The number chosen in place of their names, and nothing while none is. */
  countOnly?: boolean
  onTab: (screen: FilterScreen) => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const summaryOf = useSummary(values, names, period)
  const shown = (tab: FilterScreen, active: boolean) => {
    if (!countOnly || tab === 'period') return summaryOf(tab)
    return active ? String(values[FILTER_KEYS[tab]].length) : ''
  }
  return (
    <ul className={cardSurface}>
      {screens.map((tab) => {
        const active =
          tab === 'period'
            ? period?.period !== 'all'
            : values[FILTER_KEYS[tab]].length > 0
        const off = !active && (empty?.has(tab) ?? false)
        return (
          <li key={tab} className="border-b last:border-b-0">
            <button
              type="button"
              aria-disabled={off || undefined}
              onClick={() =>
                off
                  ? toast({ text: t(`transactions.list.nothingIn.${tab}`) })
                  : onTab(tab)
              }
              className={cn(
                'flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left',
                rowHover,
                focusRing,
                off && 'opacity-50',
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
                {off ? '' : shown(tab, active)}
              </span>
              {!off && (
                <Icon name="chevron-right" className="text-muted-foreground" />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
