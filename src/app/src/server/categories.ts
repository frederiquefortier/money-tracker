import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  COLOR_ORDER_LOCALE,
  KINDS,
  categoryInputSchema,
  resolveColors,
} from '#/lib/categories'
import type { Category, CategoryEvent, Kind } from '#/lib/categories'
import { failed } from '#/lib/result'
import type { Result } from '#/lib/result'
import { getSupabase } from '#/lib/supabase.server'

export type CategoryError =
  | 'nameTaken'
  | 'inUse'
  | 'parentArchived'
  | 'beforePrevious'
  | 'notFound'
  | 'failed'
type CategoryResult<T = object> = Result<CategoryError, T>

const idInput = z.object({ id: z.uuid() })

// Raised by the triggers in the categories migration.
const RAISED: Partial<Record<string, CategoryError>> = {
  category_parent_archived: 'parentArchived',
  category_event_before_previous: 'beforePrevious',
}

function failure(
  context: string,
  error: { code?: string; message?: string },
): { ok: false; error: CategoryError } {
  if (error.code === '23505') return { ok: false, error: 'nameTaken' }
  if (error.code === '23503') return { ok: false, error: 'inUse' }
  const raised = error.message ? RAISED[error.message] : undefined
  if (raised) return { ok: false, error: raised }
  return failed('categories', context, error.code)
}

const isKind = (kind: string): kind is Kind =>
  (KINDS as ReadonlyArray<string>).includes(kind)

export const getCategories = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<Category>> => {
    const supabase = getSupabase()
    const [categories, events, periods] = await Promise.all([
      supabase
        .from('categories')
        .select(
          'id, parent_id, name, kind, icon, icon_is_auto, color, color_is_auto, is_favourite',
        ),
      supabase
        .from('category_status_events')
        .select('category_id, status, effective_on')
        .order('effective_on', { ascending: false })
        .order('id', { ascending: false }),
      supabase
        .from('category_active_periods')
        .select('category_id, active_from, active_to'),
    ])
    if (categories.error || events.error || periods.error) {
      const code = (categories.error ?? events.error ?? periods.error)?.code
      throw new Error(`Categories could not be loaded (${code})`)
    }

    const history = new Map<string, Array<CategoryEvent>>()
    for (const e of events.data) {
      const list = history.get(e.category_id) ?? []
      list.push({
        status: e.status === 'archived' ? 'archived' : 'active',
        effectiveOn: e.effective_on,
      })
      history.set(e.category_id, list)
    }
    return categories.data.map((c) => ({
      id: c.id,
      parentId: c.parent_id,
      name: c.name,
      kind: isKind(c.kind) ? c.kind : 'expense',
      icon: c.icon,
      iconIsAuto: c.icon_is_auto,
      color: c.color,
      colorIsAuto: c.color_is_auto,
      isFavourite: c.is_favourite,
      history: history.get(c.id) ?? [],
      periods: periods.data
        .filter((p) => p.category_id === c.id)
        .map((p) => ({ from: p.active_from, to: p.active_to })),
    }))
  },
)

/** Brings every automatic colour in line with its parent (spec 12). */
async function recolor() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('categories')
    .select('id, parent_id, name, color, color_is_auto')
  if (error) return error
  const list = data.map((c) => ({
    id: c.id,
    parentId: c.parent_id,
    name: c.name,
    color: c.color,
    colorIsAuto: c.color_is_auto,
  }))
  const colors = resolveColors(list, COLOR_ORDER_LOCALE)
  const changed = list
    .filter((c) => c.colorIsAuto && colors.get(c.id) !== c.color)
    .map((c) => ({ id: c.id, color: colors.get(c.id) }))
  if (changed.length === 0) return null
  const result = await supabase.rpc('recolor_categories', { colors: changed })
  return result.error
}

export const saveCategory = createServerFn({ method: 'POST' })
  .validator(categoryInputSchema)
  .handler(async ({ data }): Promise<CategoryResult<{ id: string }>> => {
    const values = {
      name: data.name,
      kind: data.kind,
      parent_id: data.parentId,
      icon: data.icon,
      icon_is_auto: data.iconIsAuto,
      color: data.color,
      color_is_auto: data.colorIsAuto,
    }
    const supabase = getSupabase()
    const query = data.id
      ? supabase.from('categories').update(values).eq('id', data.id)
      : supabase.from('categories').insert(values)
    const { data: saved, error } = await query.select('id').maybeSingle()
    if (error) return failure('save', error)
    if (!saved) return { ok: false, error: 'notFound' }
    // The category is saved; a failed recolour only leaves a colour behind until the next save.
    const recolorError = await recolor()
    if (recolorError) failed('categories', 'recolor', recolorError.code)
    return { ok: true, id: saved.id }
  })

const datedInput = idInput.extend({ from: z.iso.date() })

/** Returns how many sub-categories were archived with it. */
export const archiveCategory = createServerFn({ method: 'POST' })
  .validator(datedInput)
  .handler(async ({ data }): Promise<CategoryResult<{ branch: number }>> => {
    const { data: branch, error } = await getSupabase().rpc(
      'archive_category',
      { category: data.id, archive_from: data.from },
    )
    return error ? failure('archive', error) : { ok: true, branch }
  })

export const reactivateCategory = createServerFn({ method: 'POST' })
  .validator(datedInput)
  .handler(async ({ data }): Promise<CategoryResult> => {
    const { error } = await getSupabase()
      .from('category_status_events')
      .insert({
        category_id: data.id,
        status: 'active',
        effective_on: data.from,
      })
    return error ? failure('reactivate', error) : { ok: true }
  })

export const setCategoryFavourite = createServerFn({ method: 'POST' })
  .validator(idInput.extend({ on: z.boolean() }))
  .handler(async ({ data }): Promise<CategoryResult> => {
    const { error } = await getSupabase()
      .from('categories')
      .update({ is_favourite: data.on })
      .eq('id', data.id)
    return error ? failure('favourite', error) : { ok: true }
  })

/** Children block it on the foreign key; transactions will too, with their migration. */
export const deleteCategory = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<CategoryResult> => {
    const { error } = await getSupabase()
      .from('categories')
      .delete()
      .eq('id', data.id)
    if (error) return failure('delete', error)
    const recolorError = await recolor()
    if (recolorError) failed('categories', 'recolor', recolorError.code)
    return { ok: true }
  })
