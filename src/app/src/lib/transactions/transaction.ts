import { z } from 'zod'
import { noteSchema } from '#/lib/shared/validation'
import type { Category } from '#/lib/categories/category'
import { currencyCodeSchema } from '#/lib/currencies/currency'
import type { Merchant } from '#/lib/merchants/merchant'
import type { EventItem, EventSource, EventType } from '#/lib/events/event'
import type { Person, PersonGroup } from '#/lib/people/person'

// Shared by the transaction form (spec 15) and its server functions.

export const PERSON_ROLES = ['me', 'invited', 'owes', 'from', 'with'] as const
export type PersonRole = (typeof PERSON_ROLES)[number]

export const TRANSACTION_KINDS = ['expense', 'income'] as const
export type TransactionKind = (typeof TRANSACTION_KINDS)[number]

/**
 * How the event is set (spec 22): auto follows the rule, manual is the one chosen, none
 * was cleared by hand, which the rule then remembers.
 */
export const EVENT_CHOICES = ['auto', 'manual', 'none'] as const
export type EventChoice = (typeof EVENT_CHOICES)[number]

export const SPLIT_MODES = ['amount', 'share', 'percent'] as const
export type SplitMode = (typeof SPLIT_MODES)[number]

export type FormAccount = {
  id: string
  name: string
  currency: string
  institution: string | null
  closedOn: string | null
  hiddenForNew: boolean
}

/** Per kind, the ids of the categories used most lately, most used first (CAT-06). */
export type FrequentCategories = Record<TransactionKind, Array<string>>

/** What the transaction form's pickers need. */
export type TransactionFormData = {
  accounts: Array<FormAccount>
  categories: Array<Category>
  merchants: Array<Merchant>
  frequent: FrequentCategories
  people: Array<Person>
  groups: Array<PersonGroup>
  /** The people most often on transactions lately, most first (spec 20). */
  frequentPeople: Array<string>
  events: Array<EventItem>
  eventTypes: Array<EventType>
}

/** A saved expense or income as the form loads it; amounts signed, as stored. */
export type Transaction = {
  id: string
  accountId: string
  kind: TransactionKind
  occurredOn: string
  amount: string
  originalAmount: string | null
  originalCurrency: string | null
  pending: boolean
  merchantId: string | null
  /** Who the expense was bought from (PPL-08). */
  sellerId: string | null
  note: string | null
  splitMode: SplitMode
  splits: Array<{ categoryId: string; value: string }>
  peopleMode: SplitMode
  /** In the order shown, Moi first on an expense (spec 20). */
  people: Array<{
    role: PersonRole
    personId: string | null
    headCount: number
    value: string
    amountUnknown: boolean
    /** Left empty: takes what the other lines leave (decided 2026-11-08). */
    fillsRest: boolean
    /** What came back for an owed line (spec 21). */
    back: Array<{ amount: string; date: string }>
  }>
  /** On an income, the owed lines it pays back, in order (spec 21). */
  reimburses: Array<string>
  eventId: string | null
  eventSource: EventSource | null
}

export const positiveDecimal = z
  .string()
  .regex(/^\d{1,15}(\.\d{1,4})?$/)
  .refine((value) => /[1-9]/.test(value))

export const transactionInputSchema = z
  .object({
    id: z.uuid().optional(),
    accountId: z.uuid(),
    kind: z.enum(TRANSACTION_KINDS),
    occurredOn: z.iso.date(),
    amount: positiveDecimal,
    originalAmount: positiveDecimal.nullable(),
    originalCurrency: currencyCodeSchema.nullable(),
    pending: z.boolean(),
    merchantId: z.uuid().nullable(),
    sellerId: z.uuid().nullable(),
    note: noteSchema,
    splitMode: z.enum(SPLIT_MODES),
    splits: z
      .array(z.object({ categoryId: z.uuid(), value: positiveDecimal }))
      .min(1)
      .max(50),
    peopleMode: z.enum(SPLIT_MODES),
    people: z
      .array(
        z.object({
          role: z.enum(PERSON_ROLES),
          personId: z.uuid().nullable(),
          headCount: z.number().int().min(1).max(999),
          amountUnknown: z.boolean(),
          fillsRest: z.boolean(),
          // Moi can be zero (spec 20).
          value: z.string().regex(/^\d{1,15}(\.\d{1,4})?$/),
        }),
      )
      .max(100),
    reimburses: z.array(z.uuid()).max(50),
    eventId: z.uuid().nullable(),
    eventChoice: z.enum(EVENT_CHOICES),
  })
  .refine((t) => (t.originalAmount === null) === (t.originalCurrency === null))
export type TransactionInput = z.input<typeof transactionInputSchema>

export type TransactionError = 'notFound' | 'failed'
