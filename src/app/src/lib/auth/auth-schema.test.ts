import { describe, expect, it } from 'vitest'
import {
  newPasswordSchema,
  passwordSchema,
  signInSchema,
  totpCodeSchema,
} from '#/lib/auth/auth-schema'
import { validate } from '#/lib/forms/form-state'

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

  it('rejects anything past the 72-byte bcrypt limit', () => {
    expect(ok('a1'.repeat(37))).toBe(false)
  })
})

describe('validate', () => {
  it('returns one message id per field', () => {
    expect(
      validate(signInSchema, { email: 'nope', password: '' }).errors,
    ).toEqual({
      email: 'email',
      password: 'required',
    })
  })

  it('reports a mismatch on the confirm field', () => {
    expect(
      validate(newPasswordSchema, {
        password: 'correcthorse9',
        confirm: 'correcthorse8',
      }).errors,
    ).toEqual({
      confirm: 'mismatch',
    })
  })

  it('returns the parsed data when valid', () => {
    expect(
      validate(signInSchema, { email: 'a@b.ca', password: 'x' }).data,
    ).toEqual({
      email: 'a@b.ca',
      password: 'x',
    })
  })

  it('checks TOTP codes', () => {
    expect(totpCodeSchema.safeParse('123456').success).toBe(true)
    expect(totpCodeSchema.safeParse('12345a').success).toBe(false)
  })
})
