import { useEffect, useState } from 'react'
import { getRate } from '#/server/transactions'

/**
 * The rate from one currency to another on a date, as exact text (CUR-08). `undefined`
 * while it loads, null when the rate is missing (ADR-004).
 */
export function useRate(from: string, to: string, date: string) {
  const key = from && to && from !== to && date ? `${from}:${to}:${date}` : null
  const [loaded, setLoaded] = useState<{ key: string; rate: string | null }>()

  useEffect(() => {
    if (!key) return
    let current = true
    getRate({ data: { from, to, date } })
      .catch(() => null)
      .then((rate) => {
        if (current) setLoaded({ key, rate })
      })
    return () => {
      current = false
    }
  }, [key, from, to, date])

  if (!key) return null
  return loaded?.key === key ? loaded.rate : undefined
}
