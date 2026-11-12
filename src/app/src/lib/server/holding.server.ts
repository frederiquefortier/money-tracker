import '@tanstack/react-start/server-only'
import { HOLDING_KINDS } from '#/lib/holdings/holding'
import type {
  Holding,
  HoldingError,
  HoldingKind,
  HoldingType,
} from '#/lib/holdings/holding'
import { loaded } from '#/lib/server/db.server'
import { isOneOf } from '#/lib/shared/collections'
import { failureFor } from '#/lib/shared/result'
import { getSupabase } from '#/lib/server/supabase.server'

const isKind = isOneOf<HoldingKind>(HOLDING_KINDS)

const KNOWN: Partial<Record<string, HoldingError>> = {
  '23503': 'inUse',
  currency_removed: 'currencyRemoved',
  holding_currency_locked: 'currencyLocked',
  holding_closed_before_entry: 'closedBeforeEntry',
  holding_closed: 'closed',
  amount_precision: 'precision',
}

export const holdingFailure = failureFor('holdings', {
  ...KNOWN,
  '23505': 'nameTaken',
})
export const entryFailure = failureFor('holdings', {
  ...KNOWN,
  '23505': 'dateTaken',
})

export const TOTALS_COLUMNS =
  'holding_id, placed::text, latest_on, latest_value::text, profit::text, profit_percent::text'

// Amounts as text: PostgREST sends numeric as a JSON number, a float (ADR-004).
export const HOLDING_COLUMNS =
  'id, type, name, institution_id, country, currency, opened_on, closed_on, exclude_from_net_worth'

export async function loadHoldingTypes(): Promise<Array<HoldingType>> {
  const [data] = loaded(
    'Holding types',
    await getSupabase()
      .from('holding_types')
      .select('code, kind, country, label_fr, label_en')
      .order('code'),
  )
  return data.flatMap((t) =>
    isKind(t.kind)
      ? [
          {
            code: t.code,
            kind: t.kind,
            country: t.country,
            labelFr: t.label_fr,
            labelEn: t.label_en,
          },
        ]
      : [],
  )
}

export type HoldingRow = {
  id: string
  type: string
  name: string
  institution_id: string | null
  country: string | null
  currency: string
  opened_on: string
  closed_on: string | null
  exclude_from_net_worth: boolean
}

export type TotalsRow = {
  holding_id: string | null
  placed: string | null
  latest_on: string | null
  latest_value: string | null
  profit: string | null
  profit_percent: string | null
}

export function toHolding({
  row,
  kinds,
  totals,
  inUse,
}: {
  row: HoldingRow
  kinds: ReadonlyMap<string, HoldingKind>
  totals: TotalsRow | undefined
  inUse: boolean
}): Holding {
  return {
    id: row.id,
    type: row.type,
    kind: kinds.get(row.type) ?? 'investment',
    name: row.name,
    institutionId: row.institution_id,
    country: row.country,
    currency: row.currency,
    openedOn: row.opened_on,
    closedOn: row.closed_on,
    excludeFromNetWorth: row.exclude_from_net_worth,
    placed: totals?.placed ?? null,
    latestOn: totals?.latest_on ?? null,
    latestValue: totals?.latest_value ?? null,
    profit: totals?.profit ?? null,
    profitPercent: totals?.profit_percent ?? null,
    inUse,
  }
}
