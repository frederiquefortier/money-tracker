import { z } from 'zod'
import { fromMinor, minorDigits, parseAmount, toMinor } from '#/lib/money'

// Shared by the adjustment form (spec 16) and its server functions.

/** A saved adjustment as the form loads it: the gap is the stored amount. */
export type Adjustment = {
  id: string
  accountId: string
  occurredOn: string
  amount: string
  note: string | null
}

export const adjustmentFormSchema = z.object({
  accountId: z.string().min(1, { error: 'required' }),
  occurredOn: z.iso.date({ error: 'date' }),
  realBalance: z.string().transform((value, ctx) => {
    const amount = value ? parseAmount(value) : null
    if (amount === null) {
      ctx.addIssue({ code: 'custom', message: value ? 'amount' : 'required' })
      return z.NEVER
    }
    return amount
  }),
  note: z.string().trim().max(1000),
})

export const adjustmentInputSchema = adjustmentFormSchema.extend({
  id: z.uuid().optional(),
  accountId: z.uuid(),
})
export type AdjustmentInput = z.input<typeof adjustmentInputSchema>

/**
 * The real balance minus the app's, as a decimal string; null while either is missing or
 * the real one has more decimals than the currency. The server recomputes it on save.
 */
export function adjustmentGap(
  realBalance: string,
  appBalance: string | undefined,
  currency: string,
): string | null {
  const real = parseAmount(realBalance)
  if (real === null || appBalance === undefined) return null
  const digits = minorDigits(currency)
  const realMinor = toMinor(real, digits)
  const appMinor = toMinor(appBalance, 4)
  if (realMinor === null || appMinor === null) return null
  const scale = 10n ** BigInt(4 - digits)
  return fromMinor(realMinor * scale - appMinor, 4)
}

/** The real balance a saved gap made: the app's balance without it, plus the gap. */
export function balanceWith(appBalance: string, gap: string): string {
  return fromMinor((toMinor(appBalance, 4) ?? 0n) + (toMinor(gap, 4) ?? 0n), 4)
}
