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

export function byName<T extends { name: string }>(
  items: ReadonlyArray<T>,
  locale: string,
) {
  return [...items].sort(compareNames(locale))
}

export function indexById<T extends { id: string }>(items: ReadonlyArray<T>) {
  return new Map(items.map((item) => [item.id, item]))
}
