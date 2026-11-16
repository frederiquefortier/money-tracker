import { useEffect, useRef, useState } from 'react'
import type { FilterValues } from '#/lib/transactions/transaction-filters'

/**
 * The ticks as the sheet shows them: at once, while the list behind is told once the
 * ticking pauses, and again on closing, so a tick never waits for the list to reload.
 */
export function useLocalFilters(
  values: FilterValues,
  send: (values: FilterValues) => void,
) {
  const [local, setLocal] = useState(values)
  const pending = useRef<FilterValues | null>(null)
  const latest = useRef(send)
  latest.current = send
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const flush = () => {
    clearTimeout(timer.current)
    if (pending.current) latest.current(pending.current)
    pending.current = null
  }
  useEffect(() => flush, [])
  return [
    local,
    (next: FilterValues) => {
      setLocal(next)
      pending.current = next
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, 400)
    },
  ] as const
}
