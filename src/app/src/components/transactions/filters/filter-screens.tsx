import { useTranslation } from 'react-i18next'
import { IconButton } from '#/components/display/icon-button'
import { SearchField } from '#/components/forms/search-field'
import { FilterList } from '#/components/transactions/filters/filter-lists'
import { PeriodPanel } from '#/components/transactions/period/period-panel'
import { Button } from '#/components/ui/button'
import { SheetBody, SheetFooter, SheetHead } from '#/components/ui/sheet'
import { FilterRoot } from '#/components/transactions/filters/filter-root'
import {
  FILTER_KEYS,
  FILTER_TABS,
} from '#/lib/transactions/transaction-filters'
import type {
  FilterOptions,
  FilterScreen,
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import type {
  ListFilters,
  PeriodChoice,
} from '#/lib/transactions/transaction-list'
import { Spinner } from '#/components/feedback/spinner'

export function FilterFooter({
  cleared,
  onClear,
  onClose,
}: {
  cleared?: boolean
  /** Left out where there is nothing to clear (the period). */
  onClear?: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <SheetFooter>
      {onClear && (
        <Button
          variant="ghost"
          className="mr-auto"
          disabled={cleared}
          onClick={onClear}
        >
          {t('common.clear')}
        </Button>
      )}
      <Button onClick={onClose}>{t('transactions.list.showResults')}</Button>
    </SheetFooter>
  )
}

/** The way back to the list of filters, with the name of the one open. */
function BackRow({
  screen,
  onBack,
}: {
  screen: FilterScreen
  onBack: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <IconButton
        icon="arrow-left"
        label={t('transactions.list.backToFilters')}
        onClick={onBack}
      />
      <h3 className="font-semibold">{t(`transactions.list.${screen}`)}</h3>
    </div>
  )
}

/** The period in the sheet (ADR-032): a pick applies and stays; Effacer goes back to Tout. */
export function PeriodScreen({
  choice,
  onPeriod,
  onClose,
}: {
  choice: PeriodChoice
  onPeriod: (choice: PeriodChoice) => void
  onClose: () => void
}) {
  return (
    <>
      <SheetBody>
        <PeriodPanel choice={choice} onChange={onPeriod} />
      </SheetBody>
      <FilterFooter
        cleared={choice.period === 'all'}
        onClear={() => onPeriod({ ...choice, period: 'all' })}
        onClose={onClose}
      />
    </>
  )
}

/** The first level: the filters with what is chosen; Effacer clears them all. */
export function FilterListScreen({
  screens,
  values,
  names,
  period,
  empty,
  onTab,
  onClear,
  onClose,
}: {
  screens: ReadonlyArray<FilterScreen>
  values: FilterValues
  names: ListFilters | null
  period: PeriodChoice | null
  empty: ReadonlySet<FilterTab> | null
  onTab: (screen: FilterScreen) => void
  onClear: () => void
  onClose: () => void
}) {
  return (
    <>
      <SheetBody>
        <FilterRoot {...{ screens, values, names, period, empty, onTab }} />
      </SheetBody>
      <FilterFooter
        cleared={FILTER_TABS.every(
          (one) => values[FILTER_KEYS[one]].length === 0,
        )}
        onClear={onClear}
        onClose={onClose}
      />
    </>
  )
}

/** One filter: a back arrow when it came from the list, its search, its list. */
export function FilterDetail({
  tab,
  canGoBack,
  options,
  query,
  values,
  onQuery,
  onChange,
  onBack,
  onClose,
}: {
  tab: FilterTab
  canGoBack: boolean
  options: FilterOptions | null
  query: string
  values: FilterValues
  onQuery: (query: string) => void
  onChange: (values: FilterValues) => void
  onBack: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const key = FILTER_KEYS[tab]
  return (
    <>
      {/* Three kinds need no search. */}
      {(canGoBack || tab !== 'kinds') && (
        <SheetHead>
          {canGoBack && <BackRow screen={tab} onBack={onBack} />}
          {tab !== 'kinds' && (
            <SearchField
              value={query}
              onChange={onQuery}
              label={t(`transactions.list.search.${tab}`)}
            />
          )}
        </SheetHead>
      )}
      <SheetBody>
        {options ? (
          <FilterList
            key={tab}
            tab={tab}
            query={query}
            options={options}
            values={values}
            onChange={onChange}
          />
        ) : (
          <Spinner
            label={t('common.loading')}
            className="text-muted-foreground"
          />
        )}
      </SheetBody>
      <FilterFooter
        cleared={values[key].length === 0}
        onClear={() => onChange({ ...values, [key]: [] })}
        onClose={onClose}
      />
    </>
  )
}
