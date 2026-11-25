/** A type guard for a value from a fixed list (`KINDS`, `LOCALES`). */
export function isOneOf<T>(list: ReadonlyArray<T>) {
  return (value: unknown): value is T =>
    (list as ReadonlyArray<unknown>).includes(value)
}

/** The value when it is in `list`, else undefined: for stored and URL state. */
export function oneOf<T>(list: ReadonlyArray<T>) {
  return (value: unknown): T | undefined => list.find((item) => item === value)
}

/** For `sort`, or as the tie-break after another order. */
export function compareNames(locale: string) {
  return (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, locale)
}

/** Newest ISO date first, with no date last: archived rows. Ties keep their order. */
export function newestFirst<T>(dateOf: (item: T) => string | null | undefined) {
  return (a: T, b: T) => {
    const x = dateOf(a) ?? ''
    const y = dateOf(b) ?? ''
    if (x === y) return 0
    return x < y ? 1 : -1
  }
}

export function byName<T extends { name: string }>(
  items: ReadonlyArray<T>,
  locale: string,
  descending = false,
) {
  const sorted = [...items].sort(compareNames(locale))
  return descending ? sorted.reverse() : sorted
}

export function indexById<T extends { id: string }>(items: ReadonlyArray<T>) {
  return new Map(items.map((item) => [item.id, item]))
}

/** A list of ids as a set, with the changes a toggled list needs: open branches, collapsed groups. */
export function idSet(
  list: ReadonlyArray<string>,
  setList: (next: Array<string>) => void,
) {
  const ids: ReadonlySet<string> = new Set(list)
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
