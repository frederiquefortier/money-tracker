import { createServerFn } from '@tanstack/react-start'
import { institutionInputSchema } from '#/lib/institutions/institution'
import type {
  InstitutionError,
  InstitutionRow,
} from '#/lib/institutions/institution'
import { deleteRow, loaded, saveRow } from '#/lib/server/db.server'
import { failureFor } from '#/lib/shared/result'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'
import { getSupabase } from '#/lib/server/supabase.server'

type InstitutionResult<T = object> = Result<InstitutionError, T>

const failure = failureFor<InstitutionError>('institutions', {
  '23505': 'nameTaken',
  '23503': 'inUse',
})

/** Every institution with the accounts (open or closed) and holdings that use it. */
export const getInstitutions = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<InstitutionRow>> => {
    const supabase = getSupabase()
    const [institutions, accounts, holdings] = loaded(
      'Institutions',
      ...(await Promise.all([
        supabase
          .from('institutions')
          .select('id, name, website_url')
          .order('name'),
        supabase.from('accounts').select('institution_id'),
        supabase.from('holdings').select('institution_id'),
      ])),
    )
    const count = (rows: ReadonlyArray<{ institution_id: string | null }>) => {
      const counts = new Map<string, number>()
      for (const { institution_id: id } of rows)
        if (id) counts.set(id, (counts.get(id) ?? 0) + 1)
      return counts
    }
    const accountCounts = count(accounts)
    const holdingCounts = count(holdings)
    return institutions.map((i) => ({
      id: i.id,
      name: i.name,
      websiteUrl: i.website_url,
      accountCount: accountCounts.get(i.id) ?? 0,
      holdingCount: holdingCounts.get(i.id) ?? 0,
    }))
  },
)

export const saveInstitution = createServerFn({ method: 'POST' })
  .validator(institutionInputSchema)
  .handler(async ({ data }): Promise<InstitutionResult<{ id: string }>> => {
    const { saved, error } = await saveRow('institutions', data.id, {
      name: data.name,
      website_url: data.websiteUrl || null,
    })
    if (error) return failure('save', error)
    if (!saved) return { ok: false, error: 'notFound' }
    return { ok: true, id: saved.id }
  })

/** An institution that accounts or holdings point at refuses (23503). */
export const deleteInstitution = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<InstitutionResult> => {
    const error = await deleteRow('institutions', data.id)
    return error ? failure('delete', error) : { ok: true }
  })
