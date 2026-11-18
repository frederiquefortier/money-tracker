import { describe, expect, it } from 'vitest'
import { accountFormSchema } from '#/lib/accounts/account'

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
