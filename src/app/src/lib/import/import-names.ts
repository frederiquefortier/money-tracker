// Names are compared as the database does: case, accents and extra spaces ignored.
import { inLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'

/** Case, accents and extra spaces ignored, as the database compares names. */
export function foldName(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function categoryParts(path: string) {
  return path
    .split('>')
    .map((part) => part.trim())
    .filter((part) => part !== '')
}

export function foldPath(path: string) {
  return categoryParts(path).map(foldName).join(' > ')
}

export type HoldingTypeNames = Partial<
  Record<string, { fr: string; en: string }>
>

/** A new holding's type by its name; an unknown code (a typed type) shows as written. */
export function holdingTypeName(
  code: string,
  names: HoldingTypeNames,
  locale: Locale,
) {
  const name: { fr: string; en: string } | undefined = names[code]
  return name ? inLocale(locale, name.fr, name.en) : code
}
