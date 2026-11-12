import { createServerFn } from '@tanstack/react-start'
import { loaded } from '#/lib/server/db.server'
import { getSupabase } from '#/lib/server/supabase.server'
import { sumAmounts, summarizeHoldings } from '#/lib/net-worth/net-worth'
import { HOLDING_KINDS } from '#/lib/holdings/holding'
import { isOneOf } from '#/lib/shared/collections'
import type { HoldingKind } from '#/lib/holdings/holding'
import type { NetWorth } from '#/lib/net-worth/net-worth'

const isKind = isOneOf<HoldingKind>(HOLDING_KINDS)

/**
 * The hub's totals in the display currency: the open accounts, and the open holdings (spec 20). Amounts as text (ADR-004).
 */
export const getNetWorth = createServerFn({ method: 'GET' }).handler(
  async (): Promise<NetWorth> => {
    const supabase = getSupabase()
    const results = await Promise.all([
      supabase.from('profiles').select('display_currency').single(),
      supabase
        .from('account_balances')
        .select('account_id, display_balance::text'),
      supabase.from('accounts').select('id, currency').is('closed_on', null),
      supabase
        .from('holdings')
        .select('id, kind, currency')
        .is('closed_on', null),
      supabase
        .from('holding_totals')
        .select('holding_id, latest_on, display_value::text'),
    ])
    const [profile, balances, openAccounts, holdings, totals] = loaded(
      'Net worth',
      ...results,
    )

    const open = new Set(openAccounts.map((a) => a.id))
    const accountTotal = sumAmounts(
      balances
        .filter((b) => b.account_id !== null && open.has(b.account_id))
        .map((b) => b.display_balance),
    )

    const byHolding = new Map(totals.map((t) => [t.holding_id, t]))
    const summary = summarizeHoldings(
      holdings.flatMap((h) => {
        if (!isKind(h.kind)) return []
        const row = byHolding.get(h.id)
        return [
          {
            kind: h.kind,
            latestOn: row?.latest_on ?? null,
            displayValue: row?.display_value ?? null,
          },
        ]
      }),
    )

    const display = profile.display_currency
    const accountsConverted = openAccounts.some((a) => a.currency !== display)
    const holdingsConverted = holdings.some((h) => h.currency !== display)
    return {
      displayCurrency: display,
      accounts: {
        total: accountTotal,
        count: open.size,
        converted: accountsConverted,
      },
      holdings: { ...summary, converted: holdingsConverted },
      total: sumAmounts([accountTotal, summary.total]),
      converted: accountsConverted || holdingsConverted,
    }
  },
)
