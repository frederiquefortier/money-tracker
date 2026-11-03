import { useEffect, useState } from 'react'

/**
 * State kept per browser (ACC-07). Read after mount, so the server render and the first
 * client render agree. Storage can be missing or blocked; the state then lives in memory.
 */
export function useStoredState<T>(
  key: string,
  initial: T,
  parse: (stored: unknown) => T | undefined,
) {
  const [value, setValue] = useState(initial)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      const parsed = stored === null ? undefined : parse(JSON.parse(stored))
      if (parsed !== undefined) setValue(parsed)
    } catch {
      // Unreadable: keep the initial value.
    }
    // Read once per key; parse is the caller's pure validator.
  }, [key])

  function update(next: T) {
    setValue(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Blocked storage: the choice lasts until reload.
    }
  }

  return [value, update] as const
}
