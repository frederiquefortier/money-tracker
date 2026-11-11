import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { deleteRow, loaded, saveRow } from '#/lib/server/db.server'
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
}

const failure = failureFor('merchants', KNOWN)

export const getMerchants = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<Merchant>> => {
    const supabase = getSupabase()
    const [merchants, usage] = loaded(
      'Merchants',
      ...(await Promise.all([
        supabase
          .from('merchants')
          .select('id, name, default_category_id, person_id'),
        supabase
          .from('merchant_usage')
          .select('merchant_id, transaction_count'),
      ])),
    )
    const counts = new Map(
      usage.map((u) => [u.merchant_id, u.transaction_count ?? 0]),
    )
    return merchants.map((m) => ({
      id: m.id,
      name: m.name,
      defaultCategoryId: m.default_category_id,
      personId: m.person_id,
      transactionCount: counts.get(m.id) ?? 0,
    }))
  },
)

export const saveMerchant = createServerFn({ method: 'POST' })
  .validator(merchantInputSchema)
  .handler(async ({ data }): Promise<MerchantResult<{ id: string }>> => {
    const { saved, error } = await saveRow('merchants', data.id, {
      name: data.name,
      default_category_id: data.defaultCategoryId,
      person_id: data.personId,
    })
    if (error) return failure('save', error)
    if (!saved) return { ok: false, error: 'notFound' }
    return { ok: true, id: saved.id }
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
