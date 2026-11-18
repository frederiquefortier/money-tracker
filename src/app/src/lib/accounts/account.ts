import { z } from 'zod'
import { inLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { currencyCodeSchema } from '#/lib/currencies/currency'
import { parseAmount } from '#/lib/shared/money'
import { nameSchema } from '#/lib/shared/validation'
import type { Institution } from '#/lib/institutions/institution'

// Shared by the account forms and their server functions (SET-07).

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
  /** A transaction is in it, so it cannot be deleted. */
  inUse: boolean
}

export type AccountsPage = {
  accounts: Array<Account>
  institutions: Array<Institution>
  types: Array<AccountType>
}

export type AccountError =
  'nameTaken' | 'inUse' | 'currencyRemoved' | 'notFound' | 'failed'
