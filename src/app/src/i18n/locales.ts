// Keep in sync with the check constraint on profiles.locale (foundation migration).
export const LOCALES = [
  'fr-CA',
  'fr-CH',
  'fr-FR',
  'en-CA',
  'en-US',
  'en-GB',
] as const
export type Locale = (typeof LOCALES)[number]
export type Language = 'fr' | 'en'

export const DEFAULT_LOCALE: Locale = 'fr-CA'
export const LOCALE_COOKIE = 'locale'

const DEFAULT_BY_LANGUAGE: Record<Language, Locale> = {
  fr: 'fr-CA',
  en: 'en-CA',
}

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (LOCALES as ReadonlyArray<string>).includes(value)
  )
}

export function languageOf(locale: Locale): Language {
  return locale.startsWith('en') ? 'en' : 'fr'
}

/** Cookie first, then the browser's Accept-Language, then the default. */
export function resolveLocale(
  cookie: string | undefined,
  acceptLanguage: string | undefined,
): Locale {
  if (isLocale(cookie)) return cookie

  const tags = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';')
      const q = params.find((p) => p.trim().startsWith('q='))
      return {
        tag: tag.trim().toLowerCase(),
        q: q ? Number(q.trim().slice(2)) : 1,
      }
    })
    .filter(({ tag, q }) => tag && !Number.isNaN(q) && q > 0)
    .sort((a, b) => b.q - a.q)

  for (const { tag } of tags) {
    const exact = LOCALES.find((l) => l.toLowerCase() === tag)
    if (exact) return exact
    const language = tag.split('-')[0]
    if (language === 'fr' || language === 'en')
      return DEFAULT_BY_LANGUAGE[language]
  }
  return DEFAULT_LOCALE
}
