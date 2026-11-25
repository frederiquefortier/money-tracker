import { useMemo, useState, useSyncExternalStore } from 'react'
import { idSet } from '#/lib/shared/collections'

// What was set this session, so blocked storage still keeps a choice until reload.
const written = new Map<string, string>()
const listeners = new Map<string, Set<() => void>>()

function read(key: string) {
  if (written.has(key)) return written.get(key) ?? null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, raw: string) {
  written.set(key, raw)
  try {
    localStorage.setItem(key, raw)
  } catch {
    // Blocked storage: the choice lasts until reload.
  }
  listeners.get(key)?.forEach((notify) => notify())
}

/**
 * State kept per browser (ACC-07). Read on the first render of a page opened from inside
 * the app, so a collapsed group never shows open first; the server render and hydration
 * use `initial`, and the stored value follows right after hydration.
 */
export function useStoredState<T>(
  key: string,
  initial: T,
  parse: (stored: unknown) => T | undefined,
) {
  const [fallback] = useState(initial)
  const subscribe = useMemo(
    () => (notify: () => void) => {
      const set = listeners.get(key) ?? new Set()
      set.add(notify)
      listeners.set(key, set)
      return () => set.delete(notify)
    },
    [key],
  )
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  )
  const value = useMemo(() => {
    if (raw === null) return fallback
    try {
      return parse(JSON.parse(raw)) ?? fallback
    } catch {
      return fallback
    }
    // parse is the caller's pure validator.
  }, [raw, fallback])

  function update(next: T) {
    write(key, JSON.stringify(next))
  }

  return [value, update] as const
}

const parseIds = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : undefined

/** A set of ids kept per browser: open branches. */
export function useStoredIds(key: string) {
  const [list, setList] = useStoredState<Array<string>>(key, [], parseIds)
  return idSet(list, setList)
}
