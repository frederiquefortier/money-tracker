import '@tanstack/react-start/server-only'
import { HOLDING_KINDS } from '#/lib/holdings/holding'
import type {
  Holding,
  HoldingError,
  HoldingKind,
  HoldingType,
} from '#/lib/holdings/holding'
import { inUseIds, loaded } from '#/lib/server/db.server'
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
  holding_transfer_currency: 'currencyMismatch',
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
  'holding_id, placed::text, latest_on, latest_value::text, display_value::text, profit::text, profit_percent::text, withdrawn::text'

// Amounts as text: PostgREST sends numeric as a JSON number, a float (ADR-004).
export const HOLDING_COLUMNS =
  'id, type, type_label, kind, name, institution_id, country, currency, opened_on, closed_on'

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
  type: string | null
  type_label: string | null
  kind: string
  name: string | null
  institution_id: string | null
  country: string
  currency: string
  opened_on: string
  closed_on: string | null
}

export type TotalsRow = {
  holding_id: string | null
  placed: string | null
  withdrawn: string | null
  latest_on: string | null
  latest_value: string | null
  display_value: string | null
  profit: string | null
  profit_percent: string | null
}

export function toHolding({
  row,
  types,
  totals,
  inUse,
}: {
  row: HoldingRow
  types: ReadonlyMap<string, HoldingType>
  totals: TotalsRow | undefined
  inUse: boolean
}): Holding {
  const type = row.type ? types.get(row.type) : undefined
  const typed = row.type_label ?? row.type ?? ''
  return {
    id: row.id,
    type: row.type,
    typeFr: type?.labelFr ?? typed,
    typeEn: type?.labelEn ?? typed,
    kind: isKind(row.kind) ? row.kind : 'investment',
    name: row.name,
    institutionId: row.institution_id,
    country: row.country,
    currency: row.currency,
    openedOn: row.opened_on,
    closedOn: row.closed_on,
    ...figuresOf(totals),
    inUse,
  }
}

function figuresOf(totals: TotalsRow | undefined) {
  return {
    placed: totals?.placed ?? null,
    withdrawn: totals?.withdrawn ?? null,
    latestOn: totals?.latest_on ?? null,
    latestValue: totals?.latest_value ?? null,
    displayValue: totals?.display_value ?? null,
    profit: totals?.profit ?? null,
    profitPercent: totals?.profit_percent ?? null,
  }
}

/** The holdings with a history, which can only be archived: a transaction, a value, a contribution or a transfer. */
export async function historyIds(
  ids: ReadonlyArray<string>,
): Promise<Set<string>> {
  const supabase = getSupabase()
  const found = await Promise.all([
    inUseIds(ids, (id) =>
      supabase.from('transactions').select('id').eq('holding_id', id).limit(1),
    ),
    inUseIds(ids, (id) =>
      supabase
        .from('holding_snapshots')
        .select('id')
        .eq('holding_id', id)
        .limit(1),
    ),
    inUseIds(ids, (id) =>
      supabase
        .from('holding_contributions')
        .select('id')
        .eq('holding_id', id)
        .limit(1),
    ),
    inUseIds(ids, (id) =>
      supabase
        .from('holding_transfers')
        .select('id')
        .or(`from_holding_id.eq.${id},to_holding_id.eq.${id}`)
        .limit(1),
    ),
  ])
  return new Set(found.flatMap((set) => [...set]))
}
