import { describe, expect, it } from 'vitest'
import { indexById, isOneOf, oneOf } from './utils'

const KINDS = ['expense', 'income'] as const

describe('isOneOf / oneOf', () => {
  it('accepts only a value of the list', () => {
    expect(isOneOf(KINDS)('income')).toBe(true)
    expect(isOneOf(KINDS)('transfer')).toBe(false)
    expect(isOneOf(KINDS)(null)).toBe(false)
  })

  it('returns the value, or undefined for stored or URL state', () => {
    expect(oneOf(KINDS)('expense')).toBe('expense')
    expect(oneOf(KINDS)(42)).toBeUndefined()
  })
})

describe('indexById', () => {
  it('maps each item by its id', () => {
    const map = indexById([
      { id: 'a', n: 1 },
      { id: 'b', n: 2 },
    ])
    expect(map.get('b')?.n).toBe(2)
  })
})
