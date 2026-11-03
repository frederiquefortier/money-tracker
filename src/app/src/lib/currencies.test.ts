import { describe, expect, it } from 'vitest'
import { pickerOrder } from './currencies'

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
