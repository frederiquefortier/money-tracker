import { z } from 'zod'
import { currencyCodeSchema } from '#/lib/currencies/currency'
import { nameSchema } from '#/lib/shared/validation'
import type { Institution } from '#/lib/accounts/account'

// Shared by the Placements screens, the transaction form and the server functions (NW-01..03, 05).

export const HOLDING_KINDS = ['investment', 'asset', 'debt'] as const
export type HoldingKind = (typeof HOLDING_KINDS)[number]

export type HoldingType = {
  code: string
  kind: HoldingKind
  /** Null for a type that exists anywhere. */
  country: string | null
  labelFr: string
  labelEn: string
}

export type Holding = {
  id: string
  type: string
  kind: HoldingKind
  name: string
  institutionId: string | null
  country: string | null
  currency: string
  openedOn: string
  closedOn: string | null
  excludeFromNetWorth: boolean
  /** In the holding's currency; null when a rate is missing. */
  placed: string | null
  latestOn: string | null
  latestValue: string | null
  /** Null with no value yet, no money placed or a missing rate. */
  profit: string | null
  profitPercent: string | null
  /** A transaction is linked to it, so it cannot be deleted. */
  inUse: boolean
}

export type Snapshot = { id: string; onDate: string; amount: string }

export type Contribution = {
  id: string
  onDate: string
  amount: string
  label: string | null
}

export type HoldingDetail = Holding & {
  snapshots: Array<Snapshot>
  contributions: Array<Contribution>
}

export type HoldingsPage = {
  holdings: Array<Holding>
  institutions: Array<Institution>
  types: Array<HoldingType>
  /** Investment transactions that name no holding. */
  unlinkedCount: number
}

/** What the transaction form offers: a holding it can pay into. */
export type FormHolding = {
  id: string
  name: string
  currency: string
  openedOn: string
  closedOn: string | null
}

export type HoldingError =
  | 'nameTaken'
  | 'dateTaken'
  | 'inUse'
  | 'currencyLocked'
  | 'currencyRemoved'
  | 'closedBeforeEntry'
  | 'closed'
  | 'precision'
  | 'notFound'
  | 'failed'

const isoDate = z.iso.date({ error: 'date' })

const decimal = z
  .string()
  .trim()
  .regex(/^\d{1,15}(\.\d{1,4})?$/, { error: 'amount' })

const positive = decimal.refine((value) => /[1-9]/.test(value), {
  error: 'amount',
})

export const holdingFormSchema = z.object({
  type: z.string().min(1, { error: 'required' }),
  name: nameSchema,
  currency: currencyCodeSchema,
  country: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => value === '' || /^[A-Z]{2}$/.test(value), {
      error: 'invalid',
    }),
  openedOn: isoDate,
})

export const holdingInputSchema = holdingFormSchema.extend({
  id: z.uuid().optional(),
  institutionId: z.uuid().nullable(),
  excludeFromNetWorth: z.boolean(),
})
export type HoldingInput = z.input<typeof holdingInputSchema>

export const snapshotFormSchema = z.object({
  onDate: isoDate,
  amount: decimal,
})

export const snapshotInputSchema = snapshotFormSchema.extend({
  id: z.uuid().optional(),
  holdingId: z.uuid(),
})

export const contributionFormSchema = z.object({
  onDate: isoDate,
  amount: positive,
  label: z.string().trim().max(100, { error: 'invalid' }),
})

export const contributionInputSchema = contributionFormSchema.extend({
  id: z.uuid().optional(),
  holdingId: z.uuid(),
})

/** The holdings of each kind, in the order the page draws them. */
export function groupByKind<T extends { kind: HoldingKind }>(
  holdings: ReadonlyArray<T>,
): Array<{ kind: HoldingKind; holdings: Array<T> }> {
  return HOLDING_KINDS.map((kind) => ({
    kind,
    holdings: holdings.filter((h) => h.kind === kind),
  })).filter((group) => group.holdings.length > 0)
}

/** Whether the form offers the holding for a transaction on `date`. */
export function isOpenOn(
  holding: { openedOn: string; closedOn: string | null },
  date: string,
) {
  return (
    holding.openedOn <= date && (!holding.closedOn || date <= holding.closedOn)
  )
}
