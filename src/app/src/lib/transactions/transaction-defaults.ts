import { isActiveOn } from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import type { EventItem } from '#/lib/events/event'
import type { Merchant } from '#/lib/merchants/merchant'
import type { Person } from '#/lib/people/person'
import { isOneOf } from '#/lib/shared/collections'
import { TRANSACTION_KINDS } from '#/lib/transactions/transaction'
import { withMerchant } from '#/lib/transactions/transaction-draft'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'
import type { FilterValues } from '#/lib/transactions/transaction-filters'
import { withPeople } from '#/lib/transactions/transaction-people'
import { withSource } from '#/lib/transactions/transaction-source'

// What a new transaction starts with when it is added from a filtered list.

const isTransactionKind = isOneOf(TRANSACTION_KINDS)

const only = <T>(values: ReadonlyArray<T>) =>
  values.length === 1 ? values[0] : undefined

/**
 * A new transaction from the list takes what a filter narrows to one: its kind, its
 * category (and the category's kind), its merchant (and the merchant's default category),
 * its person and its event. The account is chosen before, with the form's other accounts.
 */
export function withFilters(
  draft: TransactionDraft,
  filters: FilterValues,
  data: {
    categories: ReadonlyArray<Pick<Category, 'id' | 'kind' | 'periods'>>
    merchants: ReadonlyArray<Pick<Merchant, 'id' | 'defaultCategoryId'>>
    people: ReadonlyArray<Pick<Person, 'id' | 'archivedOn'>>
    events: ReadonlyArray<Pick<EventItem, 'id'>>
  },
): TransactionDraft {
  const kindId = only(filters.kinds)
  const categoryId = only(filters.categoryIds)
  const category = data.categories.find(
    (c) => c.id === categoryId && isActiveOn(c, draft.occurredOn),
  )
  const kind =
    [kindId, category?.kind, draft.kind].find(isTransactionKind) ?? draft.kind
  let next: TransactionDraft = { ...draft, kind }
  if (category)
    next = { ...next, categoryId: category.id, categoryByHand: true }
  const merchant = data.merchants.find(
    (m) => m.id === only(filters.merchantIds),
  )
  if (merchant)
    next = {
      ...next,
      ...(category
        ? { merchantId: merchant.id }
        : withMerchant(
            merchant,
            data.categories.filter((c) => c.kind === kind),
          )),
    }
  const person = data.people.find(
    (p) => p.id === only(filters.personIds) && p.archivedOn === null,
  )
  if (person)
    next = {
      ...next,
      ...(kind === 'income'
        ? withSource(person.id)
        : withPeople(next, [person.id])),
    }
  const event = data.events.find((e) => e.id === only(filters.eventIds))
  if (event) next = { ...next, eventId: event.id, eventChoice: 'manual' }
  return next
}
