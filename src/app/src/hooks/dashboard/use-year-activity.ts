import { useEffect, useState } from 'react'
import type { YearActivity } from '#/lib/dashboard/year-activity'
import { todayIso } from '#/lib/shared/format'
import { getYearActivity } from '#/server/dashboard'

// A past year rarely changes, so it loads once per visit; the current one loads on each
// mount. A request already on its way is shared by every tab asking for the same year.
const requests = new Map<string, Promise<YearActivity>>()

function request(year: string): Promise<YearActivity> {
  const known = requests.get(year)
  if (known) return known
  const loading = getYearActivity({ data: { year } })
  requests.set(year, loading)
  const past = year < todayIso().slice(0, 4)
  loading.then(
    () => !past && requests.delete(year),
    () => requests.delete(year),
  )
  return loading
}

type YearState = YearActivity | 'failed' | undefined

/** Each year's activity as it arrives: undefined while loading, 'failed' on an error. */
export function useYearActivity(
  years: ReadonlyArray<string>,
): Record<string, YearState> {
  const [state, setState] = useState<Record<string, YearState>>({})
  const key = years.join(',')
  useEffect(() => {
    let current = true
    for (const year of key ? key.split(',') : [])
      request(year).then(
        (activity) => {
          if (current) setState((s) => ({ ...s, [year]: activity }))
        },
        () => {
          if (current) setState((s) => ({ ...s, [year]: 'failed' }))
        },
      )
    return () => {
      current = false
    }
  }, [key])
  return state
}
