import { describe, expect, it } from 'vitest'
import { withFilters } from '#/lib/transactions/transaction-defaults'
import { emptyDraft } from '#/lib/transactions/transaction-draft'
import { NO_FILTERS } from '#/lib/transactions/transaction-filters'
import type { FormAccount } from '#/lib/transactions/transaction'

const GROCERIES = '7d0f1c2e-0000-4000-8000-000000000002'
const HOUSE = '7d0f1c2e-0000-4000-8000-000000000003'

const account: FormAccount = {
  id: '7d0f1c2e-0000-4000-8000-000000000001',
  name: 'Chèque',
  currency: 'CAD',
  institution: null,
  closedOn: null,
  hiddenForNew: false,
}

const draft = () => emptyDraft(account, '2026-11-03')

describe('withFilters', () => {
  const always = [{ from: null, to: null }]
  const data = {
    categories: [
      { id: GROCERIES, kind: 'expense' as const, periods: always },
      { id: 'salary', kind: 'income' as const, periods: always },
      { id: 'gone', kind: 'expense' as const, periods: [] },
    ],
    merchants: [{ id: 'tau', defaultCategoryId: GROCERIES }],
    people: [
      { id: 'ana', archivedOn: null },
      { id: 'old', archivedOn: '2026-01-01' },
    ],
    events: [{ id: 'trip' }],
  }
  const filtered = (changes: Partial<typeof NO_FILTERS>) =>
    withFilters(draft(), { ...NO_FILTERS, ...changes }, data)

  it('leaves the draft alone without a single filter', () => {
    expect(filtered({})).toEqual(draft())
    expect(filtered({ categoryIds: [GROCERIES, HOUSE] })).toEqual(draft())
  })

  it('takes a single category and its kind', () => {
    expect(filtered({ categoryIds: ['salary'] })).toMatchObject({
      kind: 'income',
      categoryId: 'salary',
      categoryByHand: true,
    })
    expect(filtered({ categoryIds: ['gone'] }).categoryId).toBeNull()
  })

  it('lets a single kind win over the category’s', () => {
    expect(
      filtered({ kinds: ['income'], categoryIds: [GROCERIES] }),
    ).toMatchObject({ kind: 'income', categoryId: GROCERIES })
  })

  it('takes a merchant with its default category', () => {
    expect(filtered({ merchantIds: ['tau'] })).toMatchObject({
      merchantId: 'tau',
      categoryId: GROCERIES,
    })
  })

  it('makes a person the source of an income, a guest of an expense', () => {
    expect(
      filtered({ kinds: ['income'], personIds: ['ana'] }).people,
    ).toMatchObject([{ role: 'from', personId: 'ana' }])
    expect(filtered({ personIds: ['ana'] }).people).toMatchObject([
      { role: 'me' },
      { role: 'invited', personId: 'ana' },
    ])
    expect(filtered({ personIds: ['old'] }).people).toEqual([])
  })

  it('links the event by hand', () => {
    expect(filtered({ eventIds: ['trip'] })).toMatchObject({
      eventId: 'trip',
      eventChoice: 'manual',
    })
  })
})
