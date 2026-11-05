import { z } from 'zod'
import { positiveDecimal } from '#/lib/transactions'

// Shared by the transfer form (spec 16) and its server functions.

/** A saved transfer as the form loads it: both legs and the fee, amounts unsigned. */
export type Transfer = {
  id: string
  fromAccountId: string
  toAccountId: string
  occurredOn: string
  amount: string
  received: string
  fee: string | null
  note: string | null
  fromPending: boolean
  toPending: boolean
}

export const transferInputSchema = z
  .object({
    id: z.uuid().optional(),
    fromAccountId: z.uuid(),
    toAccountId: z.uuid(),
    occurredOn: z.iso.date(),
    amount: positiveDecimal,
    received: positiveDecimal.nullable(),
    fee: positiveDecimal.nullable(),
    note: z.string().trim().max(1000),
    fromPending: z.boolean(),
    toPending: z.boolean(),
  })
  .refine((t) => t.fromAccountId !== t.toAccountId)
export type TransferInput = z.input<typeof transferInputSchema>
