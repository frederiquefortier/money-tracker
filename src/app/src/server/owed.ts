import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { loaded } from '#/lib/server/db.server'
import { fromMinor, toMinor } from '#/lib/shared/money'
import { ANONYMOUS } from '#/lib/transactions/transaction-source'
import { getSupabase } from '#/lib/server/supabase.server'
import type { OwedLine, Balance } from '#/lib/people/owed'

// What people owe me (spec 21): the owed lines an income can pay back, and balances.

// Amounts as stored, to four places, so nothing goes through a float (ADR-004).
const minor4 = (value: string | null | undefined) =>
  toMinor(value ?? '0', 4) ?? 0n

/** A person's owed lines, or those without a name. */
function ownedBy<
  T extends {
    eq: (c: 'person_id', v: string) => T
    is: (c: 'person_id', v: null) => T
  },
>(query: T, personId: string) {
  return personId === ANONYMOUS
    ? query.is('person_id', null)
    : query.eq('person_id', personId)
}

/**
 * Spec 21: a person's owed lines an income can pay back, newest first: the open ones,
 * and those this income already pays back, with what it took counted as still owed.
 */
export const getOwedLines = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      // A person, or the lines without a name (ANONYMOUS).
      personId: z.union([z.uuid(), z.literal(ANONYMOUS)]),
      incomeId: z.uuid().optional(),
    }),
  )
  .handler(async ({ data }): Promise<Array<OwedLine>> => {
    const supabase = getSupabase()
    const [lines, links] = loaded(
      'Owed lines',
      ...(await Promise.all([
        ownedBy(
          supabase
            .from('owed_lines')
            .select(
              'id, transaction_id, occurred_on, merchant, category, category_id, currency, part::text, back::text, open, amount_unknown',
            ),
          data.personId,
        ).order('occurred_on', { ascending: false }),
        data.incomeId
          ? supabase
              .from('reimbursements')
              .select('owed_line_id, amount::text')
              .eq('income_id', data.incomeId)
          : { data: [], error: null },
      ])),
    )
    const mine = new Map(links.map((l) => [l.owed_line_id, l.amount]))
    return lines.flatMap((l) => {
      if (!l.id || !l.transaction_id || !l.occurred_on || !l.currency) return []
      const taken = mine.get(l.id)
      if (!l.open && taken === undefined) return []
      const back = minor4(l.back)
      const unknown = l.amount_unknown && back === minor4(taken)
      return [
        {
          id: l.id,
          transactionId: l.transaction_id,
          occurredOn: l.occurred_on,
          label: l.merchant ?? l.category ?? '',
          categoryId: l.category_id,
          currency: l.currency,
          left: unknown
            ? null
            : fromMinor(minor4(l.part) - back + minor4(taken), 4),
        },
      ]
    })
  })

export const getBalances = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Record<string, Balance>> => {
    const [rows] = loaded(
      'Balances',
      await getSupabase()
        .from('person_balances')
        .select('person_id, currency, open_amount::text, unknown_count'),
    )
    const balances: Record<string, Balance> = {}
    for (const r of rows) {
      if (!r.person_id || !r.currency) continue
      const b = (balances[r.person_id] ??= { amounts: [], unknown: 0 })
      if (r.open_amount && minor4(r.open_amount) > 0n)
        b.amounts.push({ amount: r.open_amount, currency: r.currency })
      b.unknown += r.unknown_count ?? 0
    }
    return balances
  },
)
