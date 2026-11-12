import { describe, expect, it } from 'vitest'
import { summarizeHoldings, sumAmounts } from '#/lib/net-worth/net-worth'

describe('sumAmounts', () => {
  it('adds in four decimals', () => {
    expect(sumAmounts(['10.5000', '-0.2500'])).toBe('10.2500')
  })
  it('is zero for nothing', () => {
    expect(sumAmounts([])).toBe('0.0000')
  })
  it('is null when one amount is missing', () => {
    expect(sumAmounts(['10.0000', null])).toBeNull()
  })
})

describe('summarizeHoldings', () => {
  it('adds investments and assets and subtracts debts', () => {
    const summary = summarizeHoldings([
      { kind: 'investment', latestOn: '2026-10-01', displayValue: '1000.0000' },
      { kind: 'asset', latestOn: '2026-11-01', displayValue: '500.0000' },
      { kind: 'debt', latestOn: '2026-09-01', displayValue: '300.0000' },
    ])
    expect(summary.total).toBe('1200.0000')
    expect(summary.counts).toEqual({ investment: 1, asset: 1, debt: 1 })
    expect(summary.updatedOn).toBe('2026-11-01')
  })
  it('counts a holding with no value but adds nothing for it', () => {
    const summary = summarizeHoldings([
      { kind: 'investment', latestOn: null, displayValue: null },
      { kind: 'investment', latestOn: '2026-10-01', displayValue: '10.0000' },
    ])
    expect(summary.total).toBe('10.0000')
    expect(summary.counts.investment).toBe(2)
  })
  it('has no total when a value cannot be converted', () => {
    const summary = summarizeHoldings([
      { kind: 'investment', latestOn: '2026-10-01', displayValue: null },
      { kind: 'asset', latestOn: '2026-10-01', displayValue: '5.0000' },
    ])
    expect(summary.total).toBeNull()
  })
  it('is zero with no holding and has no date', () => {
    expect(summarizeHoldings([])).toEqual({
      total: '0.0000',
      counts: { investment: 0, asset: 0, debt: 0 },
      updatedOn: null,
    })
  })
})
