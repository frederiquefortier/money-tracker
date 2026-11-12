import { describe, expect, it } from 'vitest'
import { isInvestmentDraft } from '#/lib/holdings/holding-link'

const categories = [
  { id: 'bourse', kind: 'investment' as const },
  { id: 'epicerie', kind: 'expense' as const },
]
const line = (key: number, categoryId: string | null) => ({
  key,
  categoryId,
  value: '1',
})

describe('isInvestmentDraft', () => {
  it('is true for a single investment category', () => {
    expect(
      isInvestmentDraft(
        { categoryId: 'bourse', lines: [], splitMode: null },
        categories,
      ),
    ).toBe(true)
  })
  it('is false with no category or another kind', () => {
    expect(
      isInvestmentDraft(
        { categoryId: null, lines: [], splitMode: null },
        categories,
      ),
    ).toBe(false)
    expect(
      isInvestmentDraft(
        { categoryId: 'epicerie', lines: [], splitMode: null },
        categories,
      ),
    ).toBe(false)
  })
  it('needs every split line to be an investment', () => {
    expect(
      isInvestmentDraft(
        {
          categoryId: null,
          lines: [line(0, 'bourse'), line(1, 'bourse')],
          splitMode: 'amount',
        },
        categories,
      ),
    ).toBe(true)
    expect(
      isInvestmentDraft(
        {
          categoryId: null,
          lines: [line(0, 'bourse'), line(1, 'epicerie')],
          splitMode: 'amount',
        },
        categories,
      ),
    ).toBe(false)
  })
})
