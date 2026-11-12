import { describe, expect, it } from 'vitest'
import { accountFormSchema, sortAccounts } from '#/lib/accounts/account'

describe('accountFormSchema', () => {
  const valid = {
    name: ' Chèque ',
    type: 'checking',
    currency: 'CAD',
    openingBalance: '1 250,50',
    openedOn: '2026-11-03',
  }

  it('trims the name and normalises the amount', () => {
    const result = accountFormSchema.parse(valid)
    expect(result.name).toBe('Chèque')
    expect(result.openingBalance).toBe('1250.50')
  })

  it('treats an empty opening balance as zero', () => {
    expect(
      accountFormSchema.parse({ ...valid, openingBalance: '' }).openingBalance,
    ).toBe('0')
  })

  it('reports field errors as validation ids', () => {
    const result = accountFormSchema.safeParse({
      ...valid,
      name: '',
      openingBalance: 'abc',
      openedOn: '03/11/2026',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((i) => [i.path[0], i.message])).toEqual([
      ['name', 'required'],
      ['openingBalance', 'amount'],
      ['openedOn', 'date'],
    ])
  })
})

describe('sortAccounts', () => {
  const account = (name: string, displayBalance: string | null) => ({
    name,
    typeLabel: 'Compte chèque',
    currency: 'CAD',
    displayBalance,
  })
  const list = [
    account('Épargne', '3000.00'),
    account('Chèque', '-45.00'),
    account('Wise', null),
  ]

  it('sorts by name in the interface language', () => {
    expect(sortAccounts(list, 'name', 'fr').map((a) => a.name)).toEqual([
      'Chèque',
      'Épargne',
      'Wise',
    ])
  })

  it('sorts by balance either way, a missing rate last', () => {
    expect(sortAccounts(list, 'balanceDesc', 'fr').map((a) => a.name)).toEqual([
      'Épargne',
      'Chèque',
      'Wise',
    ])
    expect(sortAccounts(list, 'balanceAsc', 'fr').map((a) => a.name)).toEqual([
      'Chèque',
      'Épargne',
      'Wise',
    ])
  })
})
