import { describe, expect, it } from 'vitest'
import {
  contributionFormSchema,
  holdingFormSchema,
  OTHER_TYPE,
  holdingLabel,
  isOpenOn,
  offeredType,
  snapshotFormSchema,
  transferFormSchema,
  transferTargets,
} from '#/lib/holdings/holding'

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
  const base = {
    country: 'CA',
    type: 'CA_TFSA',
    customType: '',
    kind: '',
    name: '',
    openedOn: '2020-01-01',
  }
  it('takes a predefined type with no name', () => {
    expect(holdingFormSchema.safeParse(base).success).toBe(true)
  })
  it('needs a country in two capital letters', () => {
    expect(holdingFormSchema.safeParse({ ...base, country: '' }).success).toBe(
      false,
    )
    expect(
      holdingFormSchema.safeParse({ ...base, country: 'CAN' }).success,
    ).toBe(false)
  })
  it('needs the kind and the name of a typed type', () => {
    const other = { ...base, type: OTHER_TYPE }
    const issues = (values: object) =>
      holdingFormSchema
        .safeParse(values)
        .error?.issues.map((issue) => issue.path[0])
    expect(issues(other)).toEqual(['customType', 'kind'])
    expect(
      holdingFormSchema.safeParse({
        ...other,
        customType: 'Rente',
        kind: 'asset',
      }).success,
    ).toBe(true)
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

describe('holdingLabel', () => {
  const parts = {
    name: null,
    typeFr: 'REER',
    typeEn: 'RRSP',
    institution: 'Desjardins',
    currency: 'CAD',
  }
  it('is the name when there is one', () => {
    expect(holdingLabel({ ...parts, name: 'Retraite' }, 'fr')).toBe('Retraite')
  })
  it('reads type, currency and institution without a name', () => {
    expect(holdingLabel(parts, 'fr')).toBe('REER en CAD (Desjardins)')
    expect(holdingLabel(parts, 'en')).toBe('RRSP in CAD (Desjardins)')
  })
  it('leaves out a missing institution', () => {
    expect(holdingLabel({ ...parts, institution: null }, 'fr')).toBe(
      'REER en CAD',
    )
  })
})

describe('offeredType', () => {
  const offered = [{ code: 'CA_TFSA' }, { code: 'CA_RRSP' }]
  it('keeps a type the country offers', () => {
    expect(offeredType('CA_RRSP', offered)).toBe('CA_RRSP')
  })
  it('gives the first offered one for a type the country does not offer', () => {
    expect(offeredType('CH_PILLAR3A', offered)).toBe('CA_TFSA')
  })
  it('keeps a typed type, and falls back on it when nothing is offered', () => {
    expect(offeredType(OTHER_TYPE, offered)).toBe(OTHER_TYPE)
    expect(offeredType('CA_TFSA', [])).toBe(OTHER_TYPE)
  })
})

describe('transferTargets', () => {
  const one = (
    id: string,
    extra: Partial<Parameters<typeof transferTargets>[0][number]> = {},
  ) => ({
    id,
    kind: 'investment' as const,
    currency: 'CAD',
    closedOn: null,
    ...extra,
  })
  it('offers the other open investments in the same currency', () => {
    const holdings = [
      one('a'),
      one('b'),
      one('c', { currency: 'CHF' }),
      one('d', { closedOn: '2025-01-01' }),
      one('e', { kind: 'asset' }),
    ]
    expect(
      transferTargets(holdings, { id: 'a', currency: 'CAD' }).map((h) => h.id),
    ).toEqual(['b'])
  })
  it('needs a target, a date and an amount above zero', () => {
    const ok = {
      onDate: '2026-11-01',
      amount: '400',
      to: '6f1c1e0e-3f6a-4f4e-9a8e-0c2f0b5f9a11',
    }
    expect(transferFormSchema.safeParse(ok).success).toBe(true)
    expect(transferFormSchema.safeParse({ ...ok, to: '' }).success).toBe(false)
    expect(transferFormSchema.safeParse({ ...ok, amount: '0' }).success).toBe(
      false,
    )
    expect(transferFormSchema.safeParse({ ...ok, onDate: '' }).success).toBe(
      false,
    )
  })
})
