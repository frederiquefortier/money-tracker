import { describe, expect, it } from 'vitest'
import {
  frankfurterCodes,
  frankfurterRows,
  parseHexaRate,
} from '#/lib/currencies/rate-sources'

describe('frankfurterRows', () => {
  const known = new Set(['CAD', 'CLP', 'EUR'])
  const body = [
    { date: '2024-02-29', base: 'EUR', quote: 'CAD', rate: 1.4 },
    { date: '2024-03-01', base: 'EUR', quote: 'CAD', rate: 1.5039 },
    { date: '2024-03-01', base: 'EUR', quote: 'CLP', rate: 1047.2 },
    { date: '2024-03-01', base: 'EUR', quote: 'ZZZ', rate: 2 },
    { date: '2024-03-01', base: 'EUR', quote: 'EUR', rate: 1 },
    { date: '2024-03-01', base: 'USD', quote: 'CLP', rate: 960 },
    { date: '2024-03-02', base: 'EUR', quote: 'CLP', rate: '1050.1' },
    { date: '2024-03-04', base: 'EUR', quote: 'CAD', rate: -1 },
  ]

  it('keeps EUR-based rows from the start date, known currencies only', () => {
    expect(frankfurterRows(body, '2024-03-01', known)).toEqual([
      {
        quote: 'CAD',
        rate_date: '2024-03-01',
        rate: '1.5039',
        source: 'frankfurter',
      },
      {
        quote: 'CLP',
        rate_date: '2024-03-01',
        rate: '1047.2',
        source: 'frankfurter',
      },
      {
        quote: 'CLP',
        rate_date: '2024-03-02',
        rate: '1050.1',
        source: 'frankfurter',
      },
    ])
  })

  it('returns nothing for an unexpected body', () => {
    expect(
      frankfurterRows({ status: 422, message: 'invalid' }, '2024-03-01', known),
    ).toEqual([])
  })
})

describe('frankfurterCodes', () => {
  it('keeps the fiat currencies', () => {
    expect(
      frankfurterCodes([
        { iso_code: 'GTQ', type: 'currency' },
        { iso_code: 'ADA', type: 'crypto' },
        { iso_code: 'XAU', type: 'metal' },
      ]),
    ).toEqual(new Set(['GTQ']))
  })

  it('returns nothing for an unexpected body', () => {
    expect(frankfurterCodes(null)).toEqual(new Set())
  })
})

describe('parseHexaRate', () => {
  it('reads the mid rate and its date', () => {
    expect(
      parseHexaRate({
        status_code: 200,
        data: {
          base: 'EUR',
          target: 'XOF',
          mid: 655.957,
          unit: 1,
          timestamp: '2026-11-03T00:00:01.704Z',
        },
      }),
    ).toEqual({ ok: true, rate: '655.957', date: '2026-11-03' })
  })

  it('refuses a body it does not understand', () => {
    expect(parseHexaRate(null)).toEqual({ ok: false, reason: 'unavailable' })
    expect(
      parseHexaRate({
        data: { mid: 655.957, unit: 100, timestamp: '2026-11-03T00:00:00Z' },
      }),
    ).toEqual({ ok: false, reason: 'unavailable' })
  })
})
