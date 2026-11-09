import { z } from 'zod'
import { inLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { currencyCodeSchema } from '#/lib/currencies/currency'
import { compareDecimal, parseAmount } from '#/lib/shared/money'
import { compareNames } from '#/lib/shared/collections'
import { nameSchema } from '#/lib/shared/validation'

// Shared by the account forms and their server functions (SET-07).

/** The group key of the accounts without an institution. */
export const NO_INSTITUTION = ''

export const DEFAULT_ACCOUNT_TYPE = 'checking'

/** "Chèque (Desjardins)": an account is always named with its institution. */
export function accountLabel(account: {
  name: string
  institution: string | null
}): string {
  return account.institution
    ? `${account.name} (${account.institution})`
    : account.name
}

export function typeLabel(
  type: { labelFr: string; labelEn: string },
  locale: Locale,
) {
  return inLocale(locale, type.labelFr, type.labelEn)
}

const isoDate = z.iso.date({ error: 'date' })

export const accountFormSchema = z.object({
  name: nameSchema,
  type: z.string().min(1, { error: 'required' }),
  currency: currencyCodeSchema,
  openingBalance: z.string().transform((value, ctx) => {
    const amount = parseAmount(value || '0')
    if (amount === null) {
      ctx.addIssue({ code: 'custom', message: 'amount' })
      return z.NEVER
    }
    return amount
  }),
  openedOn: isoDate,
})

export const accountInputSchema = accountFormSchema.extend({
  id: z.uuid().optional(),
  institutionId: z.uuid().nullable(),
  hiddenForNew: z.boolean(),
})
export type AccountInput = z.input<typeof accountInputSchema>

export const institutionFormSchema = z.object({
  name: nameSchema,
  websiteUrl: z
    .string()
    .trim()
    .max(500, { error: 'invalid' })
    .refine((url) => url === '' || /^https:\/\/\S+$/.test(url), {
      error: 'url',
    }),
})

export const institutionInputSchema = institutionFormSchema.extend({
  id: z.uuid().optional(),
})

export const SORTS = [
  'name',
  'type',
  'currency',
  'balanceAsc',
  'balanceDesc',
] as const
export type Sort = (typeof SORTS)[number]

type Sortable = {
  name: string
  typeLabel: string
  currency: string
  displayBalance: string | null
}

/** ACC-07. Balances compare in the display currency; a missing rate sorts last. */
export function sortAccounts<T extends Sortable>(
  accounts: ReadonlyArray<T>,
  sort: Sort,
  locale: string,
): Array<T> {
  const byName = compareNames(locale)
  const byBalance = (a: T, b: T, direction: number) => {
    if (a.displayBalance === null || b.displayBalance === null)
      return (
        Number(a.displayBalance === null) - Number(b.displayBalance === null)
      )
    return direction * compareDecimal(a.displayBalance, b.displayBalance)
  }
  const compare: Record<Sort, (a: T, b: T) => number> = {
    name: byName,
    type: (a, b) =>
      a.typeLabel.localeCompare(b.typeLabel, locale) || byName(a, b),
    currency: (a, b) => a.currency.localeCompare(b.currency) || byName(a, b),
    balanceAsc: (a, b) => byBalance(a, b, 1) || byName(a, b),
    balanceDesc: (a, b) => byBalance(a, b, -1) || byName(a, b),
  }
  return [...accounts].sort(compare[sort])
}

export type AccountType = { code: string; labelFr: string; labelEn: string }

export type Account = {
  id: string
  name: string
  type: string
  currency: string
  institutionId: string | null
  openingBalance: string
  openedOn: string
  closedOn: string | null
  hiddenForNew: boolean
  balance: string
  pending: string
  displayBalance: string | null
}

export type Institution = {
  id: string
  name: string
  websiteUrl: string | null
}

export type GroupTotal = { total: string | null; converted: boolean }

export type AccountsPage = {
  accounts: Array<Account>
  institutions: Array<Institution>
  /** Keyed by institution id, or NO_INSTITUTION. */
  totals: Record<string, GroupTotal>
  types: Array<AccountType>
}

export type AccountError =
  'nameTaken' | 'inUse' | 'currencyRemoved' | 'notFound' | 'failed'
