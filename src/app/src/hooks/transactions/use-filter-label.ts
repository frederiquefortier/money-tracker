import { useTranslation } from 'react-i18next'
import { FILTER_KEYS } from '#/lib/transactions/transaction-filters'
import type {
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'

/** The filter's tab label, with how many are ticked in it: "Catégories · 2". */
export function useFilterLabel(values: FilterValues) {
  const { t } = useTranslation()
  return (tab: FilterTab) => {
    const name = t(`transactions.list.${tab}`)
    const count = values[FILTER_KEYS[tab]].length
    return count ? t('transactions.list.filterCount', { name, count }) : name
  }
}
