import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { accountLabel } from '#/lib/accounts/account'
import { FILTER_KEYS } from '#/lib/transactions/transaction-filters'
import type {
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import type { ListFilters } from '#/lib/transactions/transaction-list'

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
