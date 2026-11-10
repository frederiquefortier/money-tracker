import { useTranslation } from 'react-i18next'
import { IconButton } from '#/components/display/icon-button'
import { SearchField } from '#/components/forms/search-field'
import { FilterList } from '#/components/transactions/filters/filter-lists'
import type { FilterOptions } from '#/components/transactions/filters/filter-lists'
import { PeriodPanel } from '#/components/transactions/period/period-panel'
import { Button } from '#/components/ui/button'
import { SheetBody, SheetFooter, SheetHead } from '#/components/ui/sheet'
import { formatCount } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { FILTER_KEYS } from '#/lib/transactions/transaction-filters'
import type {
  FilterScreen,
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import type { PeriodChoice } from '#/lib/transactions/transaction-list'

/** "Voir 128 résultats", or "Voir les résultats" while the count loads. */
function ResultCount({ total }: { total: number | null }) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (total === null) return t('transactions.list.showResults')
  if (total === 0) return t('transactions.list.noResults')
  return t('transactions.list.showCount', {
    count: total,
    shown: formatCount(total, locale),
  })
}

export function FilterFooter({
  cleared,
  total,
  onClear,
  onClose,
}: {
  cleared?: boolean
  total: number | null
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
      <Button onClick={onClose}>
        <ResultCount total={total} />
      </Button>
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

/** The period in the sheet (ADR-030): a pick applies, then back to the list or closed. */
export function PeriodScreen({
  choice,
  canGoBack,
  total,
  onPeriod,
  onBack,
  onClose,
}: {
  choice: PeriodChoice
  canGoBack: boolean
  total: number | null
  onPeriod: (choice: PeriodChoice) => void
  onBack: () => void
  onClose: () => void
}) {
  return (
    <>
      {canGoBack && (
        <SheetHead>
          <BackRow screen="period" onBack={onBack} />
        </SheetHead>
      )}
      <SheetBody className="flex flex-col gap-4">
        <PeriodPanel
          choice={choice}
          onChange={onPeriod}
          onApply={(next) => {
            onPeriod({ ...choice, ...next })
            if (canGoBack) onBack()
            else onClose()
          }}
        />
      </SheetBody>
      <FilterFooter total={total} onClose={onClose} />
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
  total,
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
  total: number | null
  onQuery: (query: string) => void
  onChange: (values: FilterValues) => void
  onBack: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const key = FILTER_KEYS[tab]
  return (
    <>
      <SheetHead>
        {canGoBack && <BackRow screen={tab} onBack={onBack} />}
        <SearchField
          value={query}
          onChange={onQuery}
          label={t(`transactions.list.search.${tab}`)}
        />
      </SheetHead>
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
          <p className="text-muted-foreground">{t('common.loading')}</p>
        )}
      </SheetBody>
      <FilterFooter
        cleared={values[key].length === 0}
        total={total}
        onClear={() => onChange({ ...values, [key]: [] })}
        onClose={onClose}
      />
    </>
  )
}
