import { describe, expect, it } from 'vitest'
import {
  accountFormSchema,
  amountForInput,
  compareDecimal,
  institutionFormSchema,
  parseAmount,
  sortAccounts,
} from './accounts'

describe('parseAmount', () => {
  it('reads French and English amounts', () => {
    expect(parseAmount('1 250,50')).toBe('1250.50')
    expect(parseAmount('1 250,5')).toBe('1250.5')
    expect(parseAmount('-500')).toBe('-500')
    expect(parseAmount('12.3456')).toBe('12.3456')
  })

  it('refuses what is not an amount', () => {
    expect(parseAmount('12,345,6')).toBeNull()
    expect(parseAmount('1.23456')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('')).toBeNull()
  })
})

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

describe('institutionFormSchema', () => {
  it('accepts an empty or https website only', () => {
    expect(
      institutionFormSchema.safeParse({ name: 'Banque', websiteUrl: '' })
        .success,
    ).toBe(true)
    expect(
      institutionFormSchema.safeParse({
        name: 'Banque',
        websiteUrl: 'http://example.com',
      }).error?.issues[0]?.message,
    ).toBe('url')
  })
})

describe('compareDecimal', () => {
  it('orders decimal strings exactly', () => {
    expect(compareDecimal('10.5', '9.99')).toBe(1)
    expect(compareDecimal('-10.5', '-9.99')).toBe(-1)
    expect(compareDecimal('-1', '0')).toBe(-1)
    expect(compareDecimal('1.50', '1.5')).toBe(0)
    expect(compareDecimal('90071992547409.93', '90071992547409.92')).toBe(1)
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

describe('amountForInput', () => {
  it('keeps two decimals at least, with the language separator', () => {
    expect(amountForInput('1250.5000', 'fr')).toBe('1250,50')
    expect(amountForInput('-0.1250', 'en')).toBe('-0.125')
    expect(amountForInput('0', 'fr')).toBe('0,00')
  })
})
