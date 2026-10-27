import { describe, expect, it } from 'vitest'
import { isLocale, languageOf, resolveLocale } from './locales'

describe('resolveLocale', () => {
  it('prefers a valid cookie', () => {
    expect(resolveLocale('en-GB', 'fr-CH')).toBe('en-GB')
  })

  it('ignores an invalid cookie', () => {
    expect(resolveLocale('de-DE', 'fr-CH,fr;q=0.9')).toBe('fr-CH')
  })

  it('matches Accept-Language exactly, case-insensitively', () => {
    expect(resolveLocale(undefined, 'EN-us')).toBe('en-US')
  })

  it('falls back to the default region for a known language', () => {
    expect(resolveLocale(undefined, 'en-AU,en;q=0.8')).toBe('en-CA')
    expect(resolveLocale(undefined, 'fr-BE')).toBe('fr-CA')
  })

  it('respects q weights', () => {
    expect(resolveLocale(undefined, 'de;q=0.9,en-GB;q=0.95,fr-CH;q=0.5')).toBe(
      'en-GB',
    )
  })

  it('skips unsupported languages and defaults', () => {
    expect(resolveLocale(undefined, 'de-CH,it;q=0.8')).toBe('fr-CA')
    expect(resolveLocale(undefined, undefined)).toBe('fr-CA')
    expect(resolveLocale(undefined, 'fr;q=0')).toBe('fr-CA')
  })
})

describe('isLocale / languageOf', () => {
  it('validates and splits locales', () => {
    expect(isLocale('fr-CH')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(languageOf('en-GB')).toBe('en')
    expect(languageOf('fr-FR')).toBe('fr')
  })
})
