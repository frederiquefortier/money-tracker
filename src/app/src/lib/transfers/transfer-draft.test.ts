import { describe, expect, it } from 'vitest'
import {
  draftFromTransfer,
  emptyTransfer,
  transferPreview,
  validateTransfer,
} from '#/lib/transfers/transfer-draft'
import type { TransferDraft } from '#/lib/transfers/transfer-draft'

const CHEQUING = '7d0f1c2e-0000-4000-8000-000000000001'
const SAVINGS = '7d0f1c2e-0000-4000-8000-000000000002'
const TRANSFER = '7d0f1c2e-0000-4000-8000-000000000004'

function draft(changes: Partial<TransferDraft> = {}): TransferDraft {
  return {
    ...emptyTransfer({
      amount: '500',
      accountId: CHEQUING,
      occurredOn: '2026-11-03',
    }),
    toId: SAVINGS,
    ...changes,
  }
}

const sameCurrency = { currencies: { from: 'CAD', to: 'CAD' }, rate: null }
const twoCurrencies = { from: 'CAD', to: 'CHF' }

describe('emptyTransfer', () => {
  it('keeps the amount, account and date from the transaction form', () => {
    const fresh = emptyTransfer({
      amount: '12,50',
      accountId: CHEQUING,
      occurredOn: '2026-11-01',
    })
    expect(fresh).toMatchObject({
      amount: '12,50',
      fromId: CHEQUING,
      toId: null,
      occurredOn: '2026-11-01',
    })
  })
})

describe('validateTransfer', () => {
  it('needs an amount and two different accounts', () => {
    expect(
      validateTransfer(draft({ amount: '', toId: null }), sameCurrency).errors,
    ).toEqual({ amount: 'required', toId: 'required' })
    expect(
      validateTransfer(draft({ toId: CHEQUING }), sameCurrency).errors,
    ).toEqual({ toId: 'sameAccount' })
  })

  it('sends no received amount within one currency', () => {
    expect(validateTransfer(draft(), sameCurrency).input).toEqual({
      id: undefined,
      fromAccountId: CHEQUING,
      toAccountId: SAVINGS,
      occurredOn: '2026-11-03',
      amount: '500.00',
      received: null,
      fee: null,
      note: '',
      fromPending: false,
      toPending: false,
    })
  })

  it('takes the received amount at the rate between two currencies', () => {
    const result = validateTransfer(draft(), {
      currencies: twoCurrencies,
      rate: '0.5788',
    })
    expect(result.input?.received).toBe('289.40')
  })

  it('asks for the received amount when the rate is missing', () => {
    expect(
      validateTransfer(draft(), { currencies: twoCurrencies, rate: null })
        .errors,
    ).toEqual({ received: 'amount' })
    expect(
      validateTransfer(draft({ received: '287,10', receivedByHand: true }), {
        currencies: twoCurrencies,
        rate: null,
      }).input?.received,
    ).toBe('287.10')
  })

  it('takes a fee once the fee category is set in Réglages', () => {
    expect(
      validateTransfer(draft({ fee: '2,5' }), {
        ...sameCurrency,
        feeCategorySet: false,
      }).errors,
    ).toEqual({ fee: 'feeCategoryUnset' })
    expect(
      validateTransfer(draft({ fee: '2,555' }), sameCurrency).errors,
    ).toEqual({ fee: 'amount' })
    expect(
      validateTransfer(draft({ fee: '2,5' }), sameCurrency).input?.fee,
    ).toBe('2.50')
  })
})

describe('transferPreview', () => {
  it('prefills what arrived, at no cost', () => {
    expect(transferPreview(draft(), twoCurrencies, '0.5788')).toEqual({
      received: 28940n,
      prefill: '289.40',
      value: '500.00',
      cost: '0.00',
    })
  })

  it('values what arrived back in the departure currency', () => {
    // 287,10 CHF at 0,5788 is 496,03 $, so 3,97 $ of cost.
    const preview = transferPreview(
      draft({ received: '287,10', receivedByHand: true }),
      twoCurrencies,
      '0.5788',
    )
    expect(preview.cost).toBe('3.97')
  })

  it('has no cost without a rate', () => {
    expect(
      transferPreview(
        draft({ received: '287,10', receivedByHand: true }),
        twoCurrencies,
        null,
      ).cost,
    ).toBeNull()
  })
})

describe('draftFromTransfer', () => {
  it('loads both sides and the fee for the form', () => {
    const loaded = draftFromTransfer(
      {
        id: TRANSFER,
        fromAccountId: CHEQUING,
        toAccountId: SAVINGS,
        occurredOn: '2026-11-03',
        amount: '500.0000',
        received: '287.1000',
        fee: '2.5000',
        note: null,
        fromPending: false,
        toPending: true,
      },
      twoCurrencies,
      'fr',
    )
    expect(loaded).toMatchObject({
      amount: '500,00',
      received: '287,10',
      receivedByHand: true,
      fee: '2,50',
      toPending: true,
    })
  })
})
