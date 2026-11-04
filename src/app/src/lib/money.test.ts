import { describe, expect, it } from 'vitest'
import {
  convertMinor,
  fromMinor,
  minorDigits,
  ratio,
  splitMinor,
  toMinor,
} from '#/lib/money'

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
