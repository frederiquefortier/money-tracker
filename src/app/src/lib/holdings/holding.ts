import { z } from 'zod'
import { currencyCodeSchema } from '#/lib/currencies/currency'
import { inLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { compareDecimal, parseAmount } from '#/lib/shared/money'
import { nameSchema } from '#/lib/shared/validation'
import type { Institution } from '#/lib/institutions/institution'

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

/** What names a holding when it has no name of its own (ADR-048). */
export type HoldingParts = {
  name: string | null
  typeFr: string
  typeEn: string
  institution: string | null
  currency: string
}

/**
 * The holding's name; with none, "type en currency (institution)" as an account reads
 * "Chèque (Desjardins)": "REER en CAD (Desjardins)", "Hypothèque en CHF". In English,
 * "RRSP in CAD (Desjardins)".
 */
export function holdingLabel(parts: HoldingParts, locale: Locale): string {
  if (parts.name) return parts.name
  const type = inLocale(locale, parts.typeFr, parts.typeEn)
  const label = `${type} ${inLocale(locale, 'en', 'in')} ${parts.currency}`
  return parts.institution ? `${label} (${parts.institution})` : label
}

export type Holding = {
  id: string
  /** The predefined type's code; null for a typed type. */
  type: string | null
  /** The type's name in each language; a typed type is the same in both. */
  typeFr: string
  typeEn: string
  kind: HoldingKind
  name: string | null
  institutionId: string | null
  country: string
  currency: string
  openedOn: string
  closedOn: string | null
  /** In the holding's currency, null when a rate is missing: the money that went in. It never goes down. */
  placed: string | null
  /** The money that came out: linked incomes and transfers out. */
  withdrawn: string | null
  latestOn: string | null
  latestValue: string | null
  /** The latest value in the display currency; null when a rate is missing. */
  displayValue: string | null
  /** Null with no value yet, no money placed or a missing rate. */
  profit: string | null
  profitPercent: string | null
  /** It has a transaction, a value, a contribution or a transfer, so it can only be archived. */
  inUse: boolean
}

export type Snapshot = { id: string; onDate: string; amount: string }

export type Contribution = {
  id: string
  onDate: string
  amount: string
  label: string | null
}

/** Money moved between two holdings; `other` is the holding on the other side. */
export type HoldingTransfer = {
  id: string
  onDate: string
  amount: string
  other: string
  outgoing: boolean
}

export type HoldingDetail = Holding & {
  snapshots: Array<Snapshot>
  contributions: Array<Contribution>
  transfers: Array<HoldingTransfer>
}

export type HoldingsPage = {
  holdings: Array<Holding>
  institutions: Array<Institution>
  types: Array<HoldingType>
  /** Investment transactions that name no holding. */
  unlinkedCount: number
  /** The investment categories, for the link to the transactions that name no holding. */
  investmentCategoryIds: Array<string>
}

/** What the transaction form offers: a holding it can pay into. */
export type FormHolding = HoldingParts & {
  id: string
  openedOn: string
  closedOn: string | null
}

export type HoldingError =
  | 'nameTaken'
  | 'dateTaken'
  | 'inUse'
  | 'currencyLocked'
  | 'currencyMismatch'
  | 'currencyRemoved'
  | 'closedBeforeEntry'
  | 'closed'
  | 'precision'
  | 'notFound'
  | 'failed'

const isoDate = z.iso.date({ error: 'date' })

// Typed as "1 250,50" or "1250.5"; a value may be zero, a contribution may not.
function amountSchema(allowZero: boolean) {
  return z.string().transform((value, ctx) => {
    const amount = parseAmount(value)
    if (
      amount === null ||
      amount.startsWith('-') ||
      (!allowZero && compareDecimal(amount, '0') === 0)
    ) {
      ctx.addIssue({ code: 'custom', message: 'amount' })
      return z.NEVER
    }
    return amount
  })
}

/** The type field's choice of a typed type; the others are predefined codes. */
export const OTHER_TYPE = 'other'

/**
 * The type the field really holds: the one chosen if the country offers it, else the
 * first one offered. A select shows its first option when its value matches none, so
 * the value must follow what is shown or the first pick would register as no change.
 */
export function offeredType(
  chosen: string,
  offered: ReadonlyArray<{ code: string }>,
): string {
  if (chosen === OTHER_TYPE || offered.some((one) => one.code === chosen))
    return chosen
  return offered.at(0)?.code ?? OTHER_TYPE
}

// The currency and the institution are chosen live, so they are not in the form's schema.
export const holdingFormSchema = z
  .object({
    country: z.string().regex(/^[A-Z]{2}$/, { error: 'required' }),
    type: z.string().min(1, { error: 'required' }),
    customType: z.string().trim().max(100, { error: 'invalid' }),
    kind: z.enum([...HOLDING_KINDS, '']),
    name: z.string().trim().max(100, { error: 'invalid' }),
    openedOn: isoDate,
  })
  .refine((v) => v.type !== OTHER_TYPE || v.customType !== '', {
    path: ['customType'],
    error: 'required',
  })
  .refine((v) => v.type !== OTHER_TYPE || v.kind !== '', {
    path: ['kind'],
    error: 'required',
  })

export const holdingInputSchema = z
  .object({
    id: z.uuid().optional(),
    country: z.string().regex(/^[A-Z]{2}$/),
    type: z.string().min(1).nullable(),
    typeLabel: nameSchema.nullable(),
    kind: z.enum(HOLDING_KINDS),
    name: nameSchema.nullable(),
    currency: currencyCodeSchema,
    institutionId: z.uuid().nullable(),
    openedOn: isoDate,
  })
  .refine((v) => (v.type === null) !== (v.typeLabel === null))
export type HoldingInput = z.input<typeof holdingInputSchema>

export const snapshotFormSchema = z.object({
  onDate: isoDate,
  amount: amountSchema(true),
})

export const snapshotInputSchema = snapshotFormSchema.extend({
  id: z.uuid().optional(),
  holdingId: z.uuid(),
})

export const contributionFormSchema = z.object({
  onDate: isoDate,
  amount: amountSchema(false),
  label: z.string().trim().max(100, { error: 'invalid' }),
})

export const transferFormSchema = z.object({
  onDate: isoDate,
  amount: amountSchema(false),
  to: z.uuid({ error: 'required' }),
})

export const transferInputSchema = transferFormSchema
  .omit({ to: true })
  .extend({ from: z.uuid(), to: z.uuid() })

export const contributionInputSchema = contributionFormSchema.extend({
  id: z.uuid().optional(),
  holdingId: z.uuid(),
})

/** The holdings a source can transfer to: other open investments in the same currency. */
export function transferTargets<
  T extends Pick<Holding, 'id' | 'kind' | 'currency' | 'closedOn'>,
>(holdings: ReadonlyArray<T>, source: Pick<Holding, 'id' | 'currency'>) {
  return holdings.filter(
    (h) =>
      h.id !== source.id &&
      h.kind === 'investment' &&
      !h.closedOn &&
      h.currency === source.currency,
  )
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

export function holdingTypeLabel(
  type: { labelFr: string; labelEn: string },
  locale: Locale,
) {
  return inLocale(locale, type.labelFr, type.labelEn)
}

export type ListedHolding = Holding & {
  institutionName: string | null
  /** The type in the user's language. */
  typeText: string
  /** The name, or what stands in for it (ADR-048). */
  label: string
}
