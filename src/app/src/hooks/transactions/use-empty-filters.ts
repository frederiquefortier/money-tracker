import { useEffect, useState } from 'react'
import { getEmptyFilters } from '#/server/filter-availability'
import type { FilterTab } from '#/lib/transactions/transaction-filters'

const NONE: ReadonlySet<FilterTab> = new Set()

/** The filters with nothing to choose from; none until the answer arrives. */
export function useEmptyFilters(): ReadonlySet<FilterTab> {
  const [empty, setEmpty] = useState(NONE)
  useEffect(() => {
    // A failed check leaves every filter enabled.
    getEmptyFilters()
      .then((tabs) => setEmpty(new Set(tabs)))
      .catch(() => {})
  }, [])
  return empty
}
