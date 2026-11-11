import { describe, expect, it } from 'vitest'
import { similarName } from './import-similar'

describe('similarName', () => {
  it('finds a name one typo away, ignoring case and accents', () => {
    expect(similarName('Cafe Mila', ['Café Mlia', 'Café Mila!'])).toBe(
      'Café Mila!',
    )
    expect(similarName('Metro', ['Métro'])).toBeNull()
    expect(similarName('Metros', ['Métro'])).toBe('Métro')
  })

  it('allows two typos only in a long name, and skips short ones', () => {
    expect(similarName('Supermarché IGA', ['Supermarche IGAA'])).toBe(
      'Supermarche IGAA',
    )
    expect(similarName('Café', ['Cafés', 'Cage'])).toBe('Cafés')
    expect(similarName('Bar', ['Bat'])).toBeNull()
    expect(similarName('Épicerie', ['Marché Bio'])).toBeNull()
  })

  it('finds a name with words added, or an article dropped', () => {
    expect(similarName('Bati', ['Bati Bassac'])).toBe('Bati Bassac')
    expect(similarName('Bati Bassac', ['Bati'])).toBe('Bati')
    expect(similarName('Subtil', ['Le Subtil'])).toBe('Le Subtil')
    expect(similarName('Le Subtil', ['Subtil'])).toBe('Subtil')
    expect(similarName('Bar', ['Bar Mila'])).toBeNull()
  })

  it('reads "&" as "et", and finds the start of a name', () => {
    expect(similarName('Ben & Flo', ['Ben et Flo'])).toBe('Ben et Flo')
    expect(similarName('Dollo', ['Dollorama'])).toBe('Dollorama')
    expect(similarName('Dollorama', ['Dollo'])).toBe('Dollo')
    expect(similarName('Café', ['Cafétéria'])).toBeNull()
  })

  it('prefers the first of the closest', () => {
    expect(similarName('Pharmaprix', ['Pharmaprlx', 'Pharmaprixx'])).toBe(
      'Pharmaprlx',
    )
  })
})
