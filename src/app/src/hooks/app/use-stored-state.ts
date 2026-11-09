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

const parseIds = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : undefined

/** A set of ids kept per browser: open branches, collapsed groups. */
export function useStoredIds(key: string) {
  const [list, setList] = useStoredState<Array<string>>(key, [], parseIds)
  const ids = new Set(list)
  return {
    ids,
    toggle: (id: string) =>
      setList(ids.has(id) ? list.filter((x) => x !== id) : [...list, id]),
    add: (id: string) => {
      if (!ids.has(id)) setList([...list, id])
    },
    /** Puts all of `group` in, or takes it all out; ids outside the group stay. */
    setAll: (group: ReadonlyArray<string>, included: boolean) =>
      setList(
        included
          ? [...new Set([...list, ...group])]
          : list.filter((id) => !group.includes(id)),
      ),
  }
}
