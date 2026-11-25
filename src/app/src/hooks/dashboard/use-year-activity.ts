import { useQuery } from '@tanstack/react-query'
import { todayIso } from '#/lib/shared/format'
import { getYearActivity } from '#/server/dashboard'

/**
 * A year's activity for the heat map; none on a null year. A past year rarely changes, so
 * it stays fresh for the visit; a save marks every year stale (useRefresh).
 */
export function useYearActivity(year: string | null) {
  return useQuery({
    queryKey: ['year-activity', year],
    queryFn: () => getYearActivity({ data: { year: year ?? '' } }),
    enabled: year !== null,
    staleTime: year && year < todayIso().slice(0, 4) ? Infinity : undefined,
  })
}
