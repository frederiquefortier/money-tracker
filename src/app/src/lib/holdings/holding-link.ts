import type { Category } from '#/lib/categories/category'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'

type CategoryKinds = ReadonlyArray<Pick<Category, 'id' | 'kind'>>

/** Every category chosen so far is an investment, and one at least is (NW-03). */
export function isInvestmentDraft(
  draft: Pick<TransactionDraft, 'categoryId' | 'lines' | 'splitMode'>,
  categories: CategoryKinds,
): boolean {
  const ids =
    draft.splitMode === null
      ? [draft.categoryId]
      : draft.lines.map((line) => line.categoryId)
  const chosen = ids.filter((id) => id !== null)
  const kinds = new Map(categories.map((c) => [c.id, c.kind]))
  return (
    chosen.length > 0 && chosen.every((id) => kinds.get(id) === 'investment')
  )
}

/** A holding only goes with investment categories: any other choice clears it. */
export function withHoldingRule(
  draft: TransactionDraft,
  categories: CategoryKinds,
): TransactionDraft {
  return draft.holdingId !== null && !isInvestmentDraft(draft, categories)
    ? { ...draft, holdingId: null }
    : draft
}
