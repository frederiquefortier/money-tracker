import { describe, expect, it } from 'vitest'
import { frankfurterRows, parseHexaRate } from '#/lib/currencies/rate-sources'

describe('frankfurterRows', () => {
  const known = new Set(['CAD', 'CHF', 'EUR'])
  const body = {
    base: 'EUR',
    rates: {
      '2024-02-29': { CAD: 1.4, CHF: 0.95 },
      '2024-03-01': { CAD: 1.5039, CHF: 0.9551, ZZZ: 2, EUR: 1 },
      '2024-03-04': { CAD: '1.6', CHF: -1 },
    },
  }

  it('flattens days into rows from the start date, known currencies only', () => {
    expect(frankfurterRows(body, '2024-03-01', known)).toEqual([
      {
        quote: 'CAD',
        rate_date: '2024-03-01',
        rate: '1.5039',
        source: 'frankfurter',
      },
      {
        quote: 'CHF',
        rate_date: '2024-03-01',
        rate: '0.9551',
        source: 'frankfurter',
      },
      {
        quote: 'CAD',
        rate_date: '2024-03-04',
        rate: '1.6',
        source: 'frankfurter',
      },
    ])
  })

  it('returns nothing for an unexpected body', () => {
    expect(
      frankfurterRows({ message: 'not found' }, '2024-03-01', known),
    ).toEqual([])
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
