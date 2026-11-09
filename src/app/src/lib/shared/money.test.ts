import { describe, expect, it } from 'vitest'
import {
  amountForInput,
  compareDecimal,
  convertBackMinor,
  convertMinor,
  fromMinor,
  minorDigits,
  parseAmount,
  ratio,
  splitMinor,
  toMinor,
} from '#/lib/shared/money'

describe('minor units', () => {
  it('knows each currency’s decimals', () => {
    expect(minorDigits('CAD')).toBe(2)
    expect(minorDigits('JPY')).toBe(0)
  })

  it('reads and writes decimal strings exactly', () => {
    expect(toMinor('84.12', 2)).toBe(8412n)
    expect(toMinor('84.1', 2)).toBe(8410n)
    expect(toMinor('84.1200', 2)).toBe(8412n)
    expect(toMinor('-0.05', 2)).toBe(-5n)
    expect(toMinor('1.005', 2)).toBeNull()
    expect(toMinor('1,5', 2)).toBeNull()
    expect(fromMinor(8412n, 2)).toBe('84.12')
    expect(fromMinor(-5n, 2)).toBe('-0.05')
    expect(fromMinor(1500n, 0)).toBe('1500')
  })
})

describe('convertBackMinor', () => {
  it('values an amount back at the same rate', () => {
    // 287,10 CHF at 0,5788 CHF per dollar is 496,0263 $, so 496,03 $.
    expect(convertBackMinor(28710n, '0.5788', { from: 2, to: 2 })).toBe(49603n)
    expect(convertBackMinor(500n, '110.5', { from: 2, to: 0 })).toBe(452n)
  })
})

describe('convertMinor', () => {
  it('converts at a rate, rounding half away from zero', () => {
    // 15,00 € at 1.4952 is 22,428 $, so 22,43 $.
    expect(convertMinor(1500n, '1.495200000000', { from: 2, to: 2 })).toBe(
      2243n,
    )
    expect(convertMinor(-1500n, '1.4952', { from: 2, to: 2 })).toBe(-2243n)
    expect(convertMinor(1000n, '0.00125', { from: 2, to: 2 })).toBe(1n)
  })

  it('handles currencies without cents', () => {
    expect(convertMinor(1000n, '108.5', { from: 2, to: 0 })).toBe(1085n)
    expect(convertMinor(1085n, '0.0092', { from: 0, to: 2 })).toBe(998n)
  })
})

describe('splitMinor', () => {
  it('gives the last line the rounding cent', () => {
    expect(splitMinor(-1000n, ['1', '1', '1'])).toEqual([-333n, -333n, -334n])
    expect(splitMinor(8412n, ['60', '40'])).toEqual([5047n, 3365n])
  })

  it('takes decimal shares', () => {
    expect(splitMinor(1000n, ['1.5', '0.5'])).toEqual([750n, 250n])
  })

  it('gives nothing when there is nothing to share by', () => {
    expect(splitMinor(1000n, ['0', '0'])).toEqual([0n, 0n])
  })
})

describe('ratio', () => {
  it('is a fraction to three places', () => {
    expect(ratio(11n, 2243n)).toBe('0.005')
    expect(ratio(1n, 0n)).toBeNull()
  })
})

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

describe('compareDecimal', () => {
  it('orders decimal strings exactly', () => {
    expect(compareDecimal('10.5', '9.99')).toBe(1)
    expect(compareDecimal('-10.5', '-9.99')).toBe(-1)
    expect(compareDecimal('-1', '0')).toBe(-1)
    expect(compareDecimal('1.50', '1.5')).toBe(0)
    expect(compareDecimal('90071992547409.93', '90071992547409.92')).toBe(1)
  })
})

describe('amountForInput', () => {
  it('keeps the currency decimals at least, with the language separator', () => {
    expect(amountForInput('1250.5000', 'CAD', 'fr')).toBe('1250,50')
    expect(amountForInput('-0.1250', 'CAD', 'en')).toBe('-0.125')
    expect(amountForInput('0', 'CAD', 'fr')).toBe('0,00')
    expect(amountForInput('84.1000', 'CAD', 'en')).toBe('84.10')
    expect(amountForInput('1500.0000', 'JPY', 'fr')).toBe('1500')
  })

  it('writes a share or percentage with only the decimals it needs', () => {
    expect(amountForInput('1.5000', null, 'fr')).toBe('1,5')
    expect(amountForInput('2.0000', null, 'en')).toBe('2')
  })
})
