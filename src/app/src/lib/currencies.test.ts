import { describe, expect, it } from 'vitest'
import { pickerOrder, searchCurrencies } from './currencies'

const currency = (code: string, nameFr: string, nameEn: string) => ({
  code,
  nameFr,
  nameEn,
  symbol: code,
  isFavourite: false,
})

const list = [
  currency('USD', 'Dollar américain', 'US Dollar'),
  currency('CHF', 'Franc suisse', 'Swiss Franc'),
  currency('CAD', 'Dollar canadien', 'Canadian Dollar'),
  { ...currency('EUR', 'Euro', 'Euro'), isFavourite: true },
]

describe('pickerOrder', () => {
  it('puts favourites first, then sorts by code', () => {
    expect(pickerOrder(list).map((c) => c.code)).toEqual([
      'EUR',
      'CAD',
      'CHF',
      'USD',
    ])
  })
})

describe('searchCurrencies', () => {
  it('matches the code and both names, ignoring case and accents', () => {
    expect(searchCurrencies(list, 'chf').map((c) => c.code)).toEqual(['CHF'])
    expect(searchCurrencies(list, 'americain').map((c) => c.code)).toEqual([
      'USD',
    ])
    expect(searchCurrencies(list, 'swiss').map((c) => c.code)).toEqual(['CHF'])
  })

  it('returns everything for an empty query', () => {
    expect(searchCurrencies(list, '  ')).toHaveLength(4)
  })
})
