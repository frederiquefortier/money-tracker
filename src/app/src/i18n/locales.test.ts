import { describe, expect, it } from 'vitest'
import { isLocale, resolveLocale, toLocale } from './locales'

describe('resolveLocale', () => {
  it('prefers a valid cookie', () => {
    expect(resolveLocale('en', 'fr-CH')).toBe('en')
  })

  it('reads a regional cookie from before ADR-019', () => {
    expect(resolveLocale('en-GB', 'fr')).toBe('en')
  })

  it('ignores an unknown cookie', () => {
    expect(resolveLocale('de', 'fr-CH,fr;q=0.9')).toBe('fr')
  })

  it('takes the language of the first supported Accept-Language tag', () => {
    expect(resolveLocale(undefined, 'EN-us')).toBe('en')
    expect(resolveLocale(undefined, 'fr-BE')).toBe('fr')
  })

  it('respects q weights', () => {
    expect(resolveLocale(undefined, 'de;q=0.9,en-GB;q=0.95,fr-CH;q=0.5')).toBe(
      'en',
    )
  })

  it('skips unsupported languages and defaults', () => {
    expect(resolveLocale(undefined, 'de-CH,it;q=0.8')).toBe('fr')
    expect(resolveLocale(undefined, undefined)).toBe('fr')
    expect(resolveLocale(undefined, 'en;q=0')).toBe('fr')
  })
})

describe('isLocale / toLocale', () => {
  it('accepts only the two languages', () => {
    expect(isLocale('fr')).toBe(true)
    expect(isLocale('fr-CA')).toBe(false)
  })

  it('normalises stored values', () => {
    expect(toLocale('fr-CH')).toBe('fr')
    expect(toLocale('EN')).toBe('en')
    expect(toLocale('de-DE')).toBeUndefined()
    expect(toLocale(null)).toBeUndefined()
  })
})
