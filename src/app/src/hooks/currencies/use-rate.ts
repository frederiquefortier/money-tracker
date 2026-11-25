import { useQuery } from '@tanstack/react-query'
import { getRate } from '#/server/currencies'

/**
 * The rate from one currency to another on a date, as exact text (CUR-08). `undefined`
 * while it loads, null when the rate is missing or on an error (ADR-004).
 */
export function useRate(from: string, to: string, date: string) {
  const enabled = Boolean(from && to && from !== to && date)
  const { data } = useQuery({
    queryKey: ['rate', from, to, date],
    queryFn: () => getRate({ data: { from, to, date } }).catch(() => null),
    enabled,
  })
  return enabled ? data : null
}
