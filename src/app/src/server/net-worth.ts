import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { seriesRows } from '#/lib/net-worth/net-worth-series'
import { allRows, loaded } from '#/lib/server/db.server'
import { getSupabase } from '#/lib/server/supabase.server'
import {
  COLLAPSED_GROUPS_COOKIE,
  groupKeysSchema,
  parseGroupKeys,
  todayTotal,
} from '#/lib/net-worth/net-worth'
import type { Result } from '#/lib/shared/result'
import type { NetWorth } from '#/lib/net-worth/net-worth'
import type {
  ChartItem,
  FlowRow,
  ItemGroup,
} from '#/lib/net-worth/net-worth-series'

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
      // A credit card is a debt in the chart, however short.
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

function flowRows(
  rows: ReadonlyArray<{
    on_date: string
    holding_id: string
    display_amount: string | null
  }>,
): Array<FlowRow> {
  return rows.map((r) => ({
    onDate: r.on_date,
    holdingId: r.holding_id,
    displayAmount: r.display_amount,
  }))
}

/**
 * The hub's net worth in the display currency, then the chart's whole history and the
 * items it can leave out. Amounts as text (ADR-004).
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
      // One row per item per month grows past the API's row cap (bugs.md).
      allRows((from, to) => supabase.rpc('net_worth_series').range(from, to)),
      allRows((from, to) => supabase.rpc('holding_flows').range(from, to)),
    ])
    const [profile, balances, accounts, holdings, totals, series, flows] =
      loaded('Net worth', ...results)

    const openAccounts = accounts.filter((a) => a.closed_on === null)
    const openHoldings = holdings.filter((h) => h.closed_on === null)
    const display = profile.display_currency
    return {
      displayCurrency: display,
      total: todayTotal({ balances, accounts, holdings, totals }),
      converted: [...openAccounts, ...openHoldings].some(
        (item) => item.currency !== display,
      ),
      series: seriesRows(series),
      items: chartItems(accounts, holdings),
      flows: flowRows(flows),
      collapsed: parseGroupKeys(getCookie(COLLAPSED_GROUPS_COOKIE)),
    }
  },
)

/** Per browser, as the sorts: which groups of the hub's list are folded. */
export const setCollapsedGroups = createServerFn({ method: 'POST' })
  .validator(z.object({ keys: groupKeysSchema }))
  .handler(async ({ data }): Promise<Result<never>> => {
    setCookie(COLLAPSED_GROUPS_COOKIE, JSON.stringify(data.keys), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: !import.meta.env.DEV,
      sameSite: 'lax',
    })
    return { ok: true }
  })
