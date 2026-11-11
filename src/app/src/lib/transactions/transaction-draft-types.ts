import type { PersonLine } from '#/lib/transactions/transaction-people'
import type {
  EventChoice,
  SplitMode,
  TransactionKind,
} from '#/lib/transactions/transaction'

// What the transaction form holds while it is being filled.

/** One split line as typed; `key` keeps React rows stable while lines come and go. */
export type SplitLine = {
  key: number
  categoryId: string | null
  value: string
}

/** Everything the form holds. `splitMode` null is the single category field. */
export type TransactionDraft = {
  kind: TransactionKind
  amount: string
  currency: string
  paid: string
  paidByHand: boolean
  accountId: string | null
  occurredOn: string
  merchantId: string | null
  sellerId: string | null
  categoryId: string | null
  categoryByHand: boolean
  splitMode: SplitMode | null
  lines: Array<SplitLine>
  note: string
  pending: boolean
  /** Empty when no one is on the transaction. */
  people: Array<PersonLine>
  peopleMode: SplitMode
  /** An income's owed lines it pays back, in order. */
  reimburses: Array<string>
  /** The event shown in the field, and how it got there. */
  eventId: string | null
  eventChoice: EventChoice
}

/** How a part of the form hands its changes up to the draft. */
export type DraftUpdate = (changes: Partial<TransactionDraft>) => void
