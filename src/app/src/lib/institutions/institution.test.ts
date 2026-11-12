import { describe, expect, it } from 'vitest'
import { institutionFormSchema } from '#/lib/institutions/institution'

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
