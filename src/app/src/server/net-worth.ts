import { createServerFn } from '@tanstack/react-start'
import { loaded } from '#/lib/server/db.server'
import { getSupabase } from '#/lib/server/supabase.server'
import { sumAmounts, summarizeHoldings } from '#/lib/net-worth/net-worth'
import { HOLDING_KINDS } from '#/lib/holdings/holding'
import { isOneOf } from '#/lib/shared/collections'
import type { HoldingKind } from '#/lib/holdings/holding'
import type { NetWorth } from '#/lib/net-worth/net-worth'
import type {
  ChartItem,
  ItemGroup,
  SeriesRow,
} from '#/lib/net-worth/net-worth-series'

const isKind = isOneOf<HoldingKind>(HOLDING_KINDS)
const isSeriesKind = isOneOf<SeriesRow['kind']>(['account', ...HOLDING_KINDS])

type Named = { name: string } | null

function holdingGroup(kind: string): ItemGroup {
  if (kind === 'debt') return 'debts'
  return kind === 'asset' ? 'assets' : 'investments'
}

function chartItems(
  accounts: ReadonlyArray<{
    id: string
    name: string
    type: string
    closed_on: string | null
    institutions: Named
  }>,
  holdings: ReadonlyArray<{
    id: string
    name: string | null
    kind: string
    type_label: string | null
    currency: string
    closed_on: string | null
    institutions: Named
    holding_types: { label_fr: string; label_en: string } | null
  }>,
): Array<ChartItem> {
  return [
    ...accounts.map((a) => ({
      id: a.id,
      closed: a.closed_on !== null,
      // A credit card is a debt in the chart, however short (author, 2026-11-17).
      group:
        a.type === 'credit_card' ? ('debts' as const) : ('accounts' as const),
      type: 'account' as const,
      name: a.name,
      institution: a.institutions?.name ?? null,
    })),
    ...holdings.map((h) => ({
      id: h.id,
      closed: h.closed_on !== null,
      group: holdingGroup(h.kind),
      type: 'holding' as const,
      parts: {
        name: h.name,
        typeFr: h.holding_types?.label_fr ?? h.type_label ?? '',
        typeEn: h.holding_types?.label_en ?? h.type_label ?? '',
        institution: h.institutions?.name ?? null,
        currency: h.currency,
      },
    })),
  ]
}

function seriesRows(
  rows: ReadonlyArray<{
    on_date: string
    kind: string
    item_id: string
    display_value: string | null
  }>,
): Array<SeriesRow> {
  return rows.flatMap((r) =>
    isSeriesKind(r.kind)
      ? [
          {
            onDate: r.on_date,
            kind: r.kind,
            itemId: r.item_id,
            displayValue: r.display_value,
          },
        ]
      : [],
  )
}

/**
 * The hub's totals in the display currency: the open accounts, and the open holdings (spec 20),
 * then the chart's whole history and the items it can leave out. Amounts as text (ADR-004).
 */
export const getNetWorth = createServerFn({ method: 'GET' }).handler(
  async (): Promise<NetWorth> => {
    const supabase = getSupabase()
    const results = await Promise.all([
      supabase.from('profiles').select('display_currency').single(),
      supabase
        .from('account_balances')
        .select('account_id, display_balance::text'),
      supabase
        .from('accounts')
        .select('id, name, type, currency, closed_on, institutions(name)'),
      supabase
        .from('holdings')
        .select(
          'id, name, kind, type_label, currency, closed_on, institutions(name), holding_types(label_fr, label_en)',
        ),
      supabase
        .from('holding_totals')
        .select('holding_id, latest_on, display_value::text'),
      supabase.rpc('net_worth_series'),
    ])
    const [profile, balances, accounts, holdings, totals, series] = loaded(
      'Net worth',
      ...results,
    )

    const openAccounts = accounts.filter((a) => a.closed_on === null)
    const openHoldings = holdings.filter((h) => h.closed_on === null)
    const open = new Set(openAccounts.map((a) => a.id))
    const accountTotal = sumAmounts(
      balances
        .filter((b) => b.account_id !== null && open.has(b.account_id))
        .map((b) => b.display_balance),
    )

    const byHolding = new Map(totals.map((t) => [t.holding_id, t]))
    const summary = summarizeHoldings(
      openHoldings.flatMap((h) => {
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
    const holdingsConverted = openHoldings.some((h) => h.currency !== display)
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
      series: seriesRows(series),
      items: chartItems(accounts, holdings),
    }
  },
)
