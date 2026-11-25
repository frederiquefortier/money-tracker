import { useTranslation } from 'react-i18next'
import { useLocale } from '#/hooks/app/use-locale'
import { formatDate, formatMonth } from '#/lib/shared/format'
import { anyFilter } from '#/lib/transactions/transaction-filters'
import type { Query } from '#/lib/transactions/transaction-search'

/** What an empty list says: no match, or nothing in the period. */
export function useEmptyText(query: Query) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (query.search || anyFilter(query) || query.pendingOnly || query.owedOnly)
    return t('common.noMatch')
  if (query.period === 'month')
    return t('transactions.list.empty.month', {
      period: formatMonth(query.month, locale),
    })
  if (query.period === 'year')
    return t('transactions.list.empty.year', { period: query.year })
  if (query.period === 'custom')
    return t('transactions.list.empty.custom', {
      start: formatDate(query.start, locale, 'medium'),
      end: formatDate(query.end, locale, 'medium'),
    })
  return t('transactions.list.empty.all')
}
