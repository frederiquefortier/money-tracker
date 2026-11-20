import { useEffect, useState } from 'react'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import { todayIso } from '#/lib/shared/format'
import { getDailySpending } from '#/server/dashboard'

// A past year rarely changes, so it loads once per visit; the current one loads each time.
const loadedYears = new Map<string, Array<DaySpent>>()

/**
 * The heat map's days for `year`, loaded when it is shown; null while loading, or when no
 * year is (Tout). `failed` when the server could not answer.
 */
export function useDailySpending(year: string | null) {
  const [state, setState] = useState<{
    year: string | null
    days: Array<DaySpent> | null
    failed: boolean
  }>({ year: null, days: null, failed: false })
  useEffect(() => {
    if (year === null) return
    const known = loadedYears.get(year)
    if (known) {
      setState({ year, days: known, failed: false })
      return
    }
    let current = true
    getDailySpending({ data: { year } })
      .then((days) => {
        if (year < todayIso().slice(0, 4)) loadedYears.set(year, days)
        if (current) setState({ year, days, failed: false })
      })
      .catch(() => {
        if (current) setState({ year, days: null, failed: true })
      })
    return () => {
      current = false
    }
  }, [year])
  const shown = state.year === year
  return {
    days: shown ? state.days : null,
    failed: shown && state.failed,
  }
}
