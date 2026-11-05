import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// `rounded-field` is our own radius: unregistered, it would not replace `rounded-xl`.
const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ['field'] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// One focus style everywhere: an outline in the text colour, never the error red.
export const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

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

/** For search: case and accents ignored, so "americain" finds "Dollar américain". */
export function foldForSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}
