import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { merchantInputSchema } from '#/lib/merchants'
import type { Merchant } from '#/lib/merchants'
import { failed } from '#/lib/result'
import type { Result } from '#/lib/result'
import { getSupabase } from '#/lib/supabase.server'

export type MerchantError = 'nameTaken' | 'notFound' | 'failed'
type MerchantResult<T = object> = Result<MerchantError, T>

function failure(
  context: string,
  error: { code?: string },
): { ok: false; error: MerchantError } {
  if (error.code === '23505') return { ok: false, error: 'nameTaken' }
  // merge_merchants raises it for a merchant the user cannot see.
  if (error.code === 'P0002') return { ok: false, error: 'notFound' }
  return failed('merchants', context, error.code)
}

export const getMerchants = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<Merchant>> => {
    const { data, error } = await getSupabase()
      .from('merchants')
      .select('id, name, default_category_id')
    if (error) throw new Error(`Merchants could not be loaded (${error.code})`)
    return data.map((m) => ({
      id: m.id,
      name: m.name,
      defaultCategoryId: m.default_category_id,
    }))
  },
)

export const saveMerchant = createServerFn({ method: 'POST' })
  .validator(merchantInputSchema)
  .handler(async ({ data }): Promise<MerchantResult<{ id: string }>> => {
    const values = {
      name: data.name,
      default_category_id: data.defaultCategoryId,
    }
    const supabase = getSupabase()
    const query = data.id
      ? supabase.from('merchants').update(values).eq('id', data.id)
      : supabase.from('merchants').insert(values)
    const { data: saved, error } = await query.select('id').maybeSingle()
    if (error) return failure('save', error)
    if (!saved) return { ok: false, error: 'notFound' }
    return { ok: true, id: saved.id }
  })

export const deleteMerchant = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.uuid() }))
  .handler(async ({ data }): Promise<MerchantResult> => {
    const { error } = await getSupabase()
      .from('merchants')
      .delete()
      .eq('id', data.id)
    return error ? failure('delete', error) : { ok: true }
  })

/** MER-05: one SQL function, so a merge is never half done (ADR-012). */
export const mergeMerchants = createServerFn({ method: 'POST' })
  .validator(z.object({ source: z.uuid(), target: z.uuid() }))
  .handler(async ({ data }): Promise<MerchantResult> => {
    const { error } = await getSupabase().rpc('merge_merchants', data)
    return error ? failure('merge', error) : { ok: true }
  })
