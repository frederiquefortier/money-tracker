import { describe, expect, it } from 'vitest'
import { passwordSchema } from './password'

const ok = (p: string) => passwordSchema.safeParse(p).success

describe('passwordSchema', () => {
  it('accepts 12+ characters with a letter and a digit', () => {
    expect(ok('correcthorse9')).toBe(true)
    expect(ok('épargne-2026!')).toBe(true)
  })

  it('rejects short, letter-only or digit-only passwords', () => {
    expect(ok('short1')).toBe(false)
    expect(ok('onlylettersheretoo')).toBe(false)
    expect(ok('123456789012')).toBe(false)
  })

  it('rejects anything past bcrypt’s 72-byte limit', () => {
    expect(ok('a1'.repeat(37))).toBe(false)
  })
})
