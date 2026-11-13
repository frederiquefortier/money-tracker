import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { deleteRow, loaded } from '#/lib/server/db.server'
import { merchantInputSchema } from '#/lib/merchants/merchant'
import type { Merchant, MerchantError } from '#/lib/merchants/merchant'
import { failureFor } from '#/lib/shared/result'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'
import { getSupabase } from '#/lib/server/supabase.server'

type MerchantResult<T = object> = Result<MerchantError, T>

const KNOWN: Partial<Record<string, MerchantError>> = {
  '23505': 'nameTaken',
  // merge_merchants raises it for a merchant the user cannot see.
  P0002: 'notFound',
  // Raised by the alias triggers (MER-02).
  alias_taken: 'aliasTaken',
  name_is_alias: 'nameTaken',
}

const failure = failureFor('merchants', KNOWN)

export const getMerchants = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<Merchant>> => {
    const supabase = getSupabase()
    const [merchants, aliases, usage, suggested] = loaded(
      'Merchants',
      ...(await Promise.all([
        supabase.from('merchants').select('id, name, default_category_id'),
        supabase.from('merchant_aliases').select('merchant_id, alias'),
        supabase
          .from('merchant_usage')
          .select('merchant_id, transaction_count'),
        supabase
          .from('merchant_suggested_category')
          .select('merchant_id, category_id'),
      ])),
    )
    const counts = new Map(
      usage.map((u) => [u.merchant_id, u.transaction_count ?? 0]),
    )
    const suggestions = new Map(
      suggested.map((s) => [s.merchant_id, s.category_id]),
    )
    return merchants.map((m) => ({
      id: m.id,
      name: m.name,
      defaultCategoryId: m.default_category_id,
      suggestedCategoryId: suggestions.get(m.id) ?? null,
      aliases: aliases
        .filter((a) => a.merchant_id === m.id)
        .map((a) => a.alias),
      transactionCount: counts.get(m.id) ?? 0,
    }))
  },
)

export const saveMerchant = createServerFn({ method: 'POST' })
  .validator(merchantInputSchema)
  .handler(async ({ data }): Promise<MerchantResult<{ id: string }>> => {
    const { data: id, error } = await getSupabase().rpc('save_merchant', {
      merchant_id: data.id ?? null,
      name: data.name,
      default_category_id: data.defaultCategoryId,
      aliases: data.aliases,
    })
    return error ? failure('save', error) : { ok: true, id }
  })

export const deleteMerchant = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<MerchantResult> => {
    const error = await deleteRow('merchants', data.id)
    return error ? failure('delete', error) : { ok: true }
  })

/** MER-05: one SQL function, so a merge is never half done (ADR-012). */
export const mergeMerchants = createServerFn({ method: 'POST' })
  .validator(z.object({ source: z.uuid(), target: z.uuid() }))
  .handler(async ({ data }): Promise<MerchantResult> => {
    const { error } = await getSupabase().rpc('merge_merchants', data)
    return error ? failure('merge', error) : { ok: true }
  })
