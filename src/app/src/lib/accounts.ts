import { z } from 'zod'
import { inLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { currencyCodeSchema } from '#/lib/currencies'

// Shared by the account forms and their server functions (SET-07).

/** The group key of the accounts without an institution. */
export const NO_INSTITUTION = ''

export const DEFAULT_ACCOUNT_TYPE = 'checking'

export function typeLabel(
  type: { labelFr: string; labelEn: string },
  locale: Locale,
) {
  return inLocale(locale, type.labelFr, type.labelEn)
}

/** "1 250,50", "-500" or "1250.5" to a plain decimal string; null when not an amount. */
export function parseAmount(input: string): string | null {
  const cleaned = input.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')
  if (!/^-?\d{1,15}(\.\d{1,4})?$/.test(cleaned)) return null
  return cleaned
}

const isoDate = z.iso.date({ error: 'date' })

const nameSchema = z
  .string()
  .trim()
  .min(1, { error: 'required' })
  .max(100, { error: 'invalid' })

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

/** Compares decimal strings exactly, without going through a float (ADR-004). */
export function compareDecimal(a: string, b: string): number {
  const negA = a.startsWith('-')
  const negB = b.startsWith('-')
  if (negA !== negB) return negA ? -1 : 1
  const [intA = '', fracA = ''] = a.replace('-', '').split('.')
  const [intB = '', fracB = ''] = b.replace('-', '').split('.')
  const width = Math.max(fracA.length, fracB.length)
  const digitsA = intA.replace(/^0+(?=\d)/, '') + fracA.padEnd(width, '0')
  const digitsB = intB.replace(/^0+(?=\d)/, '') + fracB.padEnd(width, '0')
  const magnitude =
    digitsA.length - digitsB.length || digitsA.localeCompare(digitsB)
  const sign = Math.sign(magnitude)
  return negA ? -sign : sign
}

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
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, locale)
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

/** A stored numeric ("1250.5000") as typed in the form: two decimals at least. */
export function amountForInput(amount: string, locale: string): string {
  const [int = '0', frac = ''] = amount.split('.')
  const trimmed = frac.replace(/0+$/, '').padEnd(2, '0')
  return `${int}${locale === 'fr' ? ',' : '.'}${trimmed}`
}
