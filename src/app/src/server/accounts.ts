import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  NO_INSTITUTION,
  accountInputSchema,
  institutionInputSchema,
} from '#/lib/accounts/account'
import { loaded, saveRow } from '#/lib/server/db.server'
import { failureFor } from '#/lib/shared/result'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'
import { getSupabase } from '#/lib/server/supabase.server'
import type {
  Institution,
  AccountsPage,
  AccountError,
} from '#/lib/accounts/account'

type AccountResult<T = object> = Result<AccountError, T>

const KNOWN: Partial<Record<string, AccountError>> = {
  '23505': 'nameTaken',
  '23503': 'inUse',
  currency_removed: 'currencyRemoved',
}

const failure = failureFor('accounts', KNOWN)

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
  const [data] = loaded(
    'Account types',
    await getSupabase()
      .from('account_types')
      .select('code, label_fr, label_en')
      .order('code'),
  )
  return data.map((t) => ({
    code: t.code,
    labelFr: t.label_fr,
    labelEn: t.label_en,
  }))
}

async function getInstitutions(): Promise<Array<Institution>> {
  const [data] = loaded(
    'Institutions',
    await getSupabase()
      .from('institutions')
      .select('id, name, website_url')
      .order('name'),
  )
  return data.map((i) => ({
    id: i.id,
    name: i.name,
    websiteUrl: i.website_url,
  }))
}

export const getAccounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AccountsPage> => {
    const supabase = getSupabase()
    const [results, institutions, types] = await Promise.all([
      Promise.all([
        supabase.from('accounts').select(ACCOUNT_COLUMNS),
        supabase
          .from('account_balances')
          .select(
            'account_id, balance::text, pending::text, display_balance::text',
          ),
        supabase
          .from('institution_totals')
          .select('institution_id, total::text, converted'),
      ]),
      getInstitutions(),
      getTypes(),
    ])
    const [accounts, balances, totals] = loaded('Accounts', ...results)

    const byAccount = new Map(balances.map((b) => [b.account_id, b]))
    return {
      accounts: accounts.map((a) => {
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
        totals.map((t) => [
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
    const { saved, error } = await saveRow('accounts', data.id, values)
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
    const { saved, error } = await saveRow('institutions', data.id, {
      name: data.name,
      website_url: data.websiteUrl || null,
    })
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
