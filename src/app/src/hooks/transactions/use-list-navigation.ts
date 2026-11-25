import { getRouteApi } from '@tanstack/react-router'
import { useDraftSearch } from '#/hooks/transactions/use-draft-search'
import { filterSearch } from '#/lib/transactions/transaction-filters'
import type { FilterValues } from '#/lib/transactions/transaction-filters'
import type { PeriodChoice } from '#/lib/transactions/transaction-list'

const route = getRouteApi('/_authed/transactions')

/** Every change goes through the draft, so the page shows it before the list reloads. */
export function useListNavigation() {
  const navigate = route.useNavigate()
  const [shown, change] = useDraftSearch(
    route.useSearch(),
    (search, replace) => void navigate({ search, replace }),
  )
  return {
    shown,
    period: (c: PeriodChoice) =>
      change((prev) => ({
        ...prev,
        period: c.period,
        month: c.period === 'month' ? c.month : undefined,
        year: c.period === 'year' ? c.year : undefined,
        start: c.period === 'custom' ? c.start : undefined,
        end: c.period === 'custom' ? c.end : undefined,
        pending: undefined,
        owed: undefined,
      })),
    pending: (on: boolean) =>
      change((prev) => ({ ...prev, pending: on || undefined })),
    owed: (on: boolean) =>
      change((prev) => ({ ...prev, owed: on || undefined })),
    filters: (f: FilterValues) =>
      change((prev) => ({ ...prev, ...filterSearch(f) })),
    // The field already waited for typing to pause.
    search: (text: string) =>
      change((prev) => ({ ...prev, q: text.trim() || undefined }), {
        replace: true,
        now: true,
      }),
  }
}
