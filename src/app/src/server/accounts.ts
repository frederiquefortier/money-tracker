import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  NO_INSTITUTION,
  accountInputSchema,
  institutionInputSchema,
} from '#/lib/accounts'
import { failed } from '#/lib/result'
import type { Result } from '#/lib/result'
import { getSupabase } from '#/lib/supabase.server'

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
type AccountResult<T = object> = Result<AccountError, T>

const idInput = z.object({ id: z.uuid() })

function failure(
  context: string,
  error: { code?: string; message?: string },
): { ok: false; error: AccountError } {
  if (error.code === '23505') return { ok: false, error: 'nameTaken' }
  if (error.code === '23503') return { ok: false, error: 'inUse' }
  if (error.message === 'currency_removed')
    return { ok: false, error: 'currencyRemoved' }
  return failed('accounts', context, error.code)
}

// Amounts as text: PostgREST sends numeric as a JSON number, a float (ADR-004).
const ACCOUNT_COLUMNS =
  'id, name, type, currency, institution_id, opening_balance::text, opened_on, closed_on, hidden_for_new'

type AccountRow = {
  id: string
  name: string
  type: string
  currency: string
  institution_id: string | null
  opening_balance: string
  opened_on: string
  closed_on: string | null
  hidden_for_new: boolean
}

async function getTypes() {
  const { data, error } = await getSupabase()
    .from('account_types')
    .select('code, label_fr, label_en')
    .order('code')
  if (error)
    throw new Error(`Account types could not be loaded (${error.code})`)
  return data.map((t) => ({
    code: t.code,
    labelFr: t.label_fr,
    labelEn: t.label_en,
  }))
}

async function getInstitutions(): Promise<Array<Institution>> {
  const { data, error } = await getSupabase()
    .from('institutions')
    .select('id, name, website_url')
    .order('name')
  if (error) throw new Error(`Institutions could not be loaded (${error.code})`)
  return data.map((i) => ({
    id: i.id,
    name: i.name,
    websiteUrl: i.website_url,
  }))
}

export const getAccounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AccountsPage> => {
    const supabase = getSupabase()
    const [accounts, balances, totals, institutions, types] = await Promise.all(
      [
        supabase.from('accounts').select(ACCOUNT_COLUMNS),
        supabase
          .from('account_balances')
          .select(
            'account_id, balance::text, pending::text, display_balance::text',
          ),
        supabase
          .from('institution_totals')
          .select('institution_id, total::text, converted'),
        getInstitutions(),
        getTypes(),
      ],
    )
    if (accounts.error || balances.error || totals.error) {
      const code = (accounts.error ?? balances.error ?? totals.error)?.code
      throw new Error(`Accounts could not be loaded (${code})`)
    }

    const byAccount = new Map(balances.data.map((b) => [b.account_id, b]))
    return {
      accounts: accounts.data.map((a) => {
        const b = byAccount.get(a.id)
        return {
          ...toAccount(a),
          balance: b?.balance ?? a.opening_balance,
          pending: b?.pending ?? '0',
          displayBalance: b?.display_balance ?? null,
        }
      }),
      institutions,
      totals: Object.fromEntries(
        totals.data.map((t) => [
          t.institution_id ?? NO_INSTITUTION,
          { total: t.total, converted: t.converted ?? false },
        ]),
      ),
      types,
    }
  },
)

function toAccount(a: AccountRow) {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    institutionId: a.institution_id,
    openingBalance: a.opening_balance,
    openedOn: a.opened_on,
    closedOn: a.closed_on,
    hiddenForNew: a.hidden_for_new,
  }
}

export const saveAccount = createServerFn({ method: 'POST' })
  .validator(accountInputSchema)
  .handler(async ({ data }): Promise<AccountResult<{ id: string }>> => {
    const values = {
      name: data.name,
      type: data.type,
      currency: data.currency,
      institution_id: data.institutionId,
      opening_balance: data.openingBalance,
      opened_on: data.openedOn,
      hidden_for_new: data.hiddenForNew,
    }
    const supabase = getSupabase()
    const query = data.id
      ? supabase.from('accounts').update(values).eq('id', data.id)
      : supabase.from('accounts').insert(values)
    const { data: saved, error } = await query.select('id').maybeSingle()
    if (error) return failure('save', error)
    if (!saved) return { ok: false, error: 'notFound' }
    return { ok: true, id: saved.id }
  })

export const closeAccount = createServerFn({ method: 'POST' })
  .validator(idInput.extend({ closedOn: z.iso.date() }))
  .handler(async ({ data }): Promise<AccountResult> => {
    const { error } = await getSupabase()
      .from('accounts')
      .update({ closed_on: data.closedOn })
      .eq('id', data.id)
    return error ? failure('close', error) : { ok: true }
  })

export const reopenAccount = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<AccountResult> => {
    const { error } = await getSupabase()
      .from('accounts')
      .update({ closed_on: null })
      .eq('id', data.id)
    return error ? failure('reopen', error) : { ok: true }
  })

/** Accounts with transactions will refuse (spec 11); none exist yet. */
export const deleteAccount = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<AccountResult> => {
    const { error } = await getSupabase()
      .from('accounts')
      .delete()
      .eq('id', data.id)
    return error ? failure('delete', error) : { ok: true }
  })

export const saveInstitution = createServerFn({ method: 'POST' })
  .validator(institutionInputSchema)
  .handler(async ({ data }): Promise<AccountResult<{ id: string }>> => {
    const values = { name: data.name, website_url: data.websiteUrl || null }
    const supabase = getSupabase()
    const query = data.id
      ? supabase.from('institutions').update(values).eq('id', data.id)
      : supabase.from('institutions').insert(values)
    const { data: saved, error } = await query.select('id').maybeSingle()
    if (error) return failure('institution', error)
    if (!saved) return { ok: false, error: 'notFound' }
    return { ok: true, id: saved.id }
  })

export const deleteInstitution = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<AccountResult> => {
    const { error } = await getSupabase()
      .from('institutions')
      .delete()
      .eq('id', data.id)
    return error ? failure('delete institution', error) : { ok: true }
  })
