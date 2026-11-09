/** A type guard for a value from a fixed list (`KINDS`, `LOCALES`). */
export function isOneOf<T>(list: ReadonlyArray<T>) {
  return (value: unknown): value is T =>
    (list as ReadonlyArray<unknown>).includes(value)
}

/** The value when it is in `list`, else undefined: for stored and URL state. */
export function oneOf<T>(list: ReadonlyArray<T>) {
  return (value: unknown): T | undefined => list.find((item) => item === value)
}

export function indexById<T extends { id: string }>(items: ReadonlyArray<T>) {
  return new Map(items.map((item) => [item.id, item]))
}
