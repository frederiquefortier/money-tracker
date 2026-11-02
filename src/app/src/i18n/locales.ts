// Keep in sync with the check constraint on profiles.locale (migrations).
export const LOCALES = ['fr', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'fr'
export const LOCALE_COOKIE = 'locale'

// The interface offers two languages; numbers and dates still need a region. Canadian
// conventions match the home currency (ADR-019).
export const FORMAT_LOCALE: Record<Locale, string> = {
  fr: 'fr-CA',
  en: 'en-CA',
}

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (LOCALES as ReadonlyArray<string>).includes(value)
  )
}

/** Reads a stored value, including the regional tags (`fr-CH`, `en-GB`) used before ADR-019. */
export function toLocale(value: unknown): Locale | undefined {
  if (typeof value !== 'string') return undefined
  const language = value.trim().toLowerCase().split('-')[0]
  return isLocale(language) ? language : undefined
}

/** Cookie first, then the browser's Accept-Language, then the default. */
export function resolveLocale(
  cookie: string | undefined,
  acceptLanguage: string | undefined,
): Locale {
  const fromCookie = toLocale(cookie)
  if (fromCookie) return fromCookie

  const tags = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';')
      const q = params.find((p) => p.trim().startsWith('q='))
      return { tag: tag.trim(), q: q ? Number(q.trim().slice(2)) : 1 }
    })
    .filter(({ tag, q }) => tag && !Number.isNaN(q) && q > 0)
    .sort((a, b) => b.q - a.q)

  for (const { tag } of tags) {
    const locale = toLocale(tag)
    if (locale) return locale
  }
  return DEFAULT_LOCALE
}
