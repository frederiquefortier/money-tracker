import { useTranslation } from 'react-i18next'
import { formatDate, formatMonth } from '#/lib/shared/format'
import type { PeriodChoice } from '#/lib/transactions/transaction-list'
import { useLocale } from '#/hooks/app/use-locale'

/** The period as a bubble and the filters' list name it: "Novembre 2026", "Tout". */
export function usePeriodLabel() {
  const { t } = useTranslation()
  const locale = useLocale()
  return (choice: PeriodChoice) =>
    ({
      all: t('transactions.list.all'),
      year: choice.year,
      month: formatMonth(choice.month, locale),
      custom: `${formatDate(choice.start, locale, 'medium')} – ${formatDate(choice.end, locale, 'medium')}`,
    })[choice.period]
}
