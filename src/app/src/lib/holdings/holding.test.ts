import { describe, expect, it } from 'vitest'
import {
  contributionFormSchema,
  groupByKind,
  holdingFormSchema,
  isOpenOn,
  snapshotFormSchema,
} from '#/lib/holdings/holding'

describe('groupByKind', () => {
  it('orders investments, assets, debts and drops empty groups', () => {
    const groups = groupByKind([
      { kind: 'debt' as const, id: 1 },
      { kind: 'investment' as const, id: 2 },
      { kind: 'investment' as const, id: 3 },
    ])
    expect(groups.map((g) => [g.kind, g.holdings.length])).toEqual([
      ['investment', 2],
      ['debt', 1],
    ])
  })
})

describe('isOpenOn', () => {
  const holding = { openedOn: '2020-01-01', closedOn: '2026-06-30' }
  it('includes both ends', () => {
    expect(isOpenOn(holding, '2020-01-01')).toBe(true)
    expect(isOpenOn(holding, '2026-06-30')).toBe(true)
  })
  it('excludes dates outside', () => {
    expect(isOpenOn(holding, '2019-12-31')).toBe(false)
    expect(isOpenOn(holding, '2026-07-01')).toBe(false)
  })
  it('has no end while open', () => {
    expect(
      isOpenOn({ openedOn: '2020-01-01', closedOn: null }, '2030-01-01'),
    ).toBe(true)
  })
})

describe('forms', () => {
  it('upper-cases the country and allows it empty', () => {
    const base = {
      type: 'CA_TFSA',
      name: 'CELI',
      currency: 'CAD',
      openedOn: '2020-01-01',
    }
    expect(holdingFormSchema.parse({ ...base, country: 'ca' }).country).toBe(
      'CA',
    )
    expect(holdingFormSchema.parse({ ...base, country: '' }).country).toBe('')
    expect(
      holdingFormSchema.safeParse({ ...base, country: 'CAN' }).success,
    ).toBe(false)
  })
  it('lets a value be zero but not a contribution', () => {
    expect(
      snapshotFormSchema.safeParse({ onDate: '2026-01-01', amount: '0' })
        .success,
    ).toBe(true)
    expect(
      contributionFormSchema.safeParse({
        onDate: '2026-01-01',
        amount: '0',
        label: '',
      }).success,
    ).toBe(false)
  })
  it('refuses more than four decimals and negatives', () => {
    expect(
      snapshotFormSchema.safeParse({ onDate: '2026-01-01', amount: '1.23456' })
        .success,
    ).toBe(false)
    expect(
      snapshotFormSchema.safeParse({ onDate: '2026-01-01', amount: '-1' })
        .success,
    ).toBe(false)
  })
})
