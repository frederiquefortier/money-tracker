import { describe, expect, it } from 'vitest'
import {
  capPercent,
  withMerchant,
  withPicked,
  draftFromTransaction,
  emptyDraft,
  forInput,
  validateDraft,
} from '#/lib/transaction-draft'
import {
  foreignPreview,
  percentLeft,
  splitPreview,
} from '#/lib/transaction-preview'
import type { Draft } from '#/lib/transaction-draft'
import type { FormAccount } from '#/lib/transactions'

const ACCOUNT_ID = '7d0f1c2e-0000-4000-8000-000000000001'
const GROCERIES = '7d0f1c2e-0000-4000-8000-000000000002'
const HOUSE = '7d0f1c2e-0000-4000-8000-000000000003'

const account: FormAccount = {
  id: ACCOUNT_ID,
  name: 'Chèque',
  currency: 'CAD',
  institution: null,
  closedOn: null,
  hiddenForNew: false,
}

function draft(changes: Partial<Draft> = {}): Draft {
  return { ...emptyDraft(account, '2026-11-03'), ...changes }
}

const context = { accountCurrency: 'CAD', rate: null }

describe('forInput', () => {
  it('writes a stored amount as typed in the locale', () => {
    expect(forInput('-84.1200', 'CAD', 'fr')).toBe('84,12')
    expect(forInput('84.1000', 'CAD', 'en')).toBe('84.10')
    expect(forInput('1500.0000', 'JPY', 'fr')).toBe('1500')
    expect(forInput('1.5000', null, 'fr')).toBe('1,5')
  })
})

describe('validateDraft', () => {
  it('needs an amount and a category', () => {
    expect(validateDraft(draft(), context).errors).toEqual({
      amount: 'required',
      categoryId: 'required',
    })
    expect(
      validateDraft(draft({ amount: '0', categoryId: GROCERIES }), context)
        .errors,
    ).toEqual({ amount: 'amount' })
    expect(
      validateDraft(draft({ amount: '1,005', categoryId: GROCERIES }), context)
        .errors,
    ).toEqual({ amount: 'amount' })
  })

  it('sends one split with the whole amount for a single category', () => {
    const { input } = validateDraft(
      draft({ amount: '84,12', categoryId: GROCERIES, note: ' IGA ' }),
      context,
    )
    expect(input).toMatchObject({
      amount: '84.12',
      originalAmount: null,
      note: 'IGA',
      splitMode: 'amount',
      splits: [{ categoryId: GROCERIES, value: '84.12' }],
    })
  })
})

describe('validateDraft with splits', () => {
  it('wants Montant lines to reach the amount', () => {
    const lines = [
      { key: 0, categoryId: GROCERIES, value: '60' },
      { key: 1, categoryId: HOUSE, value: '20' },
    ]
    const split = draft({ amount: '84,12', splitMode: 'amount', lines })
    expect(validateDraft(split, context).errors).toEqual({
      splits: 'splitsSum',
    })
    const whole = {
      ...split,
      lines: [lines[0], { ...lines[1], value: '24,12' }],
    }
    expect(validateDraft(whole, context).input?.splits).toEqual([
      { categoryId: GROCERIES, value: '60.00' },
      { categoryId: HOUSE, value: '24.12' },
    ])
  })

  it('wants percentages to total 100 and categories once each', () => {
    const lines = [
      { key: 0, categoryId: GROCERIES, value: '60' },
      { key: 1, categoryId: HOUSE, value: '30' },
    ]
    expect(
      validateDraft(
        draft({ amount: '10', splitMode: 'percent', lines }),
        context,
      ).errors,
    ).toEqual({ splits: 'percentTotal' })
    const twice = lines.map((l) => ({ ...l, categoryId: GROCERIES }))
    expect(
      validateDraft(
        draft({ amount: '10', splitMode: 'share', lines: twice }),
        context,
      ).errors,
    ).toEqual({ splits: 'duplicateCategory' })
  })
})

describe('validateDraft in another currency', () => {
  it('books what was paid and keeps the receipt price', () => {
    const foreign = draft({
      amount: '15',
      currency: 'EUR',
      categoryId: GROCERIES,
    })
    expect(validateDraft(foreign, context).errors).toEqual({ paid: 'amount' })
    expect(
      validateDraft(foreign, { ...context, rate: '1.4952' }).input,
    ).toMatchObject({
      amount: '22.43',
      originalAmount: '15.00',
      originalCurrency: 'EUR',
    })
  })
})

describe('previews', () => {
  it('shows the fee against the market rate', () => {
    expect(
      foreignPreview(
        { amount: '15', currency: 'EUR', paid: '22,54', paidByHand: true },
        'CAD',
        '1.4952',
      ),
    ).toEqual({ paid: 2254n, prefill: '22.43', fee: '0.11', feeRatio: '0.005' })
  })

  it('shares by parts and leaves percentages under 100 unshared', () => {
    const lines = [
      { key: 0, categoryId: GROCERIES, value: '1' },
      { key: 1, categoryId: HOUSE, value: '2' },
    ]
    expect(splitPreview({ splitMode: 'share', lines }, 1000n, 'CAD')).toEqual({
      amounts: [333n, 667n],
      remaining: 0n,
    })
    expect(
      splitPreview(
        { splitMode: 'percent', lines: [{ ...lines[0], value: '50' }] },
        1001n,
        'CAD',
      ),
    ).toEqual({ amounts: [501n], remaining: 500n })
  })
})

describe('draftFromTransaction', () => {
  it('loads a foreign split transaction back into the form', () => {
    const loaded = draftFromTransaction(
      {
        id: '7d0f1c2e-0000-4000-8000-000000000009',
        accountId: ACCOUNT_ID,
        kind: 'expense',
        occurredOn: '2026-11-03',
        amount: '-22.5400',
        originalAmount: '-15.0000',
        originalCurrency: 'EUR',
        pending: false,
        merchantId: null,
        note: null,
        splitMode: 'share',
        splits: [
          { categoryId: GROCERIES, value: '1.0000' },
          { categoryId: HOUSE, value: '2.5000' },
        ],
      },
      'CAD',
      'fr',
    )
    expect(loaded).toMatchObject({
      amount: '15,00',
      currency: 'EUR',
      paid: '22,54',
      paidByHand: true,
      splitMode: 'share',
      lines: [
        { categoryId: GROCERIES, value: '1' },
        { categoryId: HOUSE, value: '2,5' },
      ],
    })
  })
})

describe('capPercent', () => {
  const lines = [
    { key: 0, categoryId: GROCERIES, value: '60' },
    { key: 1, categoryId: HOUSE, value: '' },
  ]

  it('cuts a percentage to what the other lines leave', () => {
    expect(capPercent(lines, { key: 1, value: '30' }, 'fr')).toBe('30')
    expect(capPercent(lines, { key: 1, value: '40' }, 'fr')).toBe('40')
    expect(capPercent(lines, { key: 1, value: '75' }, 'fr')).toBe('40')
    const half = [{ ...lines[0], value: '33,5' }, lines[1]]
    expect(capPercent(half, { key: 1, value: '90' }, 'fr')).toBe('66,5')
    expect(capPercent(lines, { key: 0, value: '150' }, 'en')).toBe('100')
  })

  it('keeps what is not a number yet', () => {
    expect(capPercent(lines, { key: 1, value: '33,' }, 'fr')).toBe('33,')
    expect(capPercent(lines, { key: 1, value: '' }, 'fr')).toBe('')
  })
})

describe('withMerchant', () => {
  it('fills a merchant’s default category, if it still exists', () => {
    const categories = [{ id: GROCERIES }]
    expect(
      withMerchant({ id: 'iga', defaultCategoryId: GROCERIES }, categories),
    ).toEqual({ merchantId: 'iga', categoryId: GROCERIES })
    expect(
      withMerchant({ id: 'old', defaultCategoryId: HOUSE }, categories),
    ).toEqual({ merchantId: 'old' })
  })
})

describe('withPicked', () => {
  it('sets the transaction’s category, or one split line’s', () => {
    const lines = [
      { key: 0, categoryId: GROCERIES, value: '1' },
      { key: 1, categoryId: null, value: '1' },
    ]
    expect(withPicked({ lines }, 'main', HOUSE)).toEqual({
      categoryId: HOUSE,
      categoryByHand: true,
    })
    expect(withPicked({ lines }, 1, HOUSE).lines?.[1]?.categoryId).toBe(HOUSE)
  })
})

describe('percentLeft', () => {
  it('is what the percentages leave of 100, in 0.0001 % units', () => {
    expect(percentLeft(['60', '30'])).toBe(100000n)
    expect(percentLeft(['33,5', ''])).toBe(665000n)
    expect(percentLeft(['60', '50'])).toBe(-100000n)
  })
})
