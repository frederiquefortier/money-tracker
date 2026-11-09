import { describe, expect, it } from 'vitest'
import {
  adjustmentFormSchema,
  adjustmentGap,
  balanceWith,
} from '#/lib/adjustments/adjustment'

describe('adjustmentGap', () => {
  it('is the real balance minus the app’s', () => {
    expect(adjustmentGap('1 216,50', '1204.1000', 'CAD')).toBe('12.4000')
    expect(adjustmentGap('-500', '-499.9900', 'CAD')).toBe('-0.0100')
  })

  it('is zero when they match', () => {
    expect(adjustmentGap('20', '20.0000', 'CAD')).toBe('0.0000')
  })

  it('waits for both balances, and the currency’s decimals', () => {
    expect(adjustmentGap('', '20.0000', 'CAD')).toBeNull()
    expect(adjustmentGap('20', undefined, 'CAD')).toBeNull()
    expect(adjustmentGap('20,5', '20.0000', 'JPY')).toBeNull()
  })
})

describe('balanceWith', () => {
  it('adds the saved gap back to the balance without it', () => {
    expect(balanceWith('1204.1000', '12.4000')).toBe('1216.5000')
    expect(balanceWith('20.0000', '-20.5000')).toBe('-0.5000')
  })
})

describe('adjustmentFormSchema', () => {
  const values = {
    accountId: 'a',
    occurredOn: '2026-11-03',
    realBalance: '',
    note: '',
  }

  it('needs a real balance', () => {
    expect(
      adjustmentFormSchema.safeParse(values).error?.issues[0]?.message,
    ).toBe('required')
    expect(
      adjustmentFormSchema.safeParse({ ...values, realBalance: 'abc' }).error
        ?.issues[0]?.message,
    ).toBe('amount')
  })

  it('takes a negative or zero balance', () => {
    expect(
      adjustmentFormSchema.parse({ ...values, realBalance: '-1 250,50' })
        .realBalance,
    ).toBe('-1250.50')
    expect(
      adjustmentFormSchema.parse({ ...values, realBalance: '0' }).realBalance,
    ).toBe('0')
  })
})
