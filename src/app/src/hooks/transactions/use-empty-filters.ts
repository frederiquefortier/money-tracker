import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEmptyFilters } from '#/server/filter-availability'
import type { FilterTab } from '#/lib/transactions/transaction-filters'

const NONE: ReadonlySet<FilterTab> = new Set()

/** The filters with nothing to choose from; none until the answer arrives. */
export function useEmptyFilters(): ReadonlySet<FilterTab> {
  // A failed check leaves every filter enabled.
  const { data } = useQuery({
    queryKey: ['empty-filters'],
    queryFn: () => getEmptyFilters(),
  })
  return useMemo(() => (data ? new Set(data) : NONE), [data])
}
