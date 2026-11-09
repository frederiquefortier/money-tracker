import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  COLOR_ORDER_LOCALE,
  KINDS,
  categoryInputSchema,
  resolveColors,
} from '#/lib/categories/category'
import type {
  Category,
  CategoryEvent,
  CategoryError,
} from '#/lib/categories/category'
import {
  deleteRow,
  loadFeeCategoryId,
  loaded,
  saveRow,
} from '#/lib/server/db.server'
import { NECESSITIES } from '#/lib/categories/category-necessity'
import { failed, failureFor } from '#/lib/shared/result'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'
import { getSupabase } from '#/lib/server/supabase.server'
import { isOneOf } from '#/lib/shared/collections'

type CategoryResult<T = object> = Result<CategoryError, T>

const KNOWN: Partial<Record<string, CategoryError>> = {
  '23505': 'nameTaken',
  '23503': 'inUse',
  // Raised by the triggers and functions in the categories migrations.
  category_parent_archived: 'parentArchived',
  category_event_before_previous: 'beforePrevious',
  category_pause_overlaps: 'pauseOverlaps',
  category_not_found: 'notFound',
}

const failure = failureFor('categories', KNOWN)

const isKind = isOneOf(KINDS)
const isNecessity = isOneOf(NECESSITIES)

export const getCategories = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<Category>> => {
    const supabase = getSupabase()
    const [results, feeId] = await Promise.all([
      Promise.all([
        supabase
          .from('categories')
          .select(
            'id, parent_id, name, kind, icon, icon_is_auto, color, color_is_auto, necessity',
          ),
        supabase
          .from('category_status_events')
          .select('category_id, status, effective_on, via_category_id')
          .order('effective_on', { ascending: false })
          .order('id', { ascending: false }),
        supabase
          .from('category_active_periods')
          .select('category_id, active_from, active_to'),
      ]),
      loadFeeCategoryId(),
    ])
    const [categories, events, periods] = loaded('Categories', ...results)

    const history = new Map<string, Array<CategoryEvent>>()
    for (const e of events) {
      const list = history.get(e.category_id) ?? []
      list.push({
        status: e.status === 'archived' ? 'archived' : 'active',
        effectiveOn: e.effective_on,
        viaId: e.via_category_id,
      })
      history.set(e.category_id, list)
    }
    return categories.map((c) => ({
      id: c.id,
      parentId: c.parent_id,
      name: c.name,
      kind: isKind(c.kind) ? c.kind : 'expense',
      icon: c.icon,
      iconIsAuto: c.icon_is_auto,
      color: c.color,
      colorIsAuto: c.color_is_auto,
      necessity: isNecessity(c.necessity) ? c.necessity : null,
      history: history.get(c.id) ?? [],
      periods: periods
        .filter((p) => p.category_id === c.id)
        .map((p) => ({ from: p.active_from, to: p.active_to })),
      isFee: c.id === feeId,
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
      // Only expense takes a mark (CAT-10); the database refuses it on other kinds.
      necessity: data.kind === 'expense' ? data.necessity : null,
    }
    const { saved, error } = await saveRow('categories', data.id, values)
    if (error) return failure('save', error)
    if (!saved) return { ok: false, error: 'notFound' }
    // The category is saved; a failed recolour only leaves a colour behind until the next save.
    const recolorError = await recolor()
    if (recolorError) failed('categories', 'recolor', recolorError.code)
    // Becoming the fee category also moves the transfer fees already saved to it.
    if (data.isFee && data.kind === 'expense') {
      const { error: feeError } = await getSupabase().rpc(
        'set_transfer_fee_category',
        { category: saved.id },
      )
      if (feeError) return failure('fee category', feeError)
    }
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

/** A past archived period (CAT-03); returns how many sub-categories got it too. */
export const addCategoryPause = createServerFn({ method: 'POST' })
  .validator(
    datedInput.extend({ until: z.iso.date() }).refine((d) => d.from < d.until),
  )
  .handler(async ({ data }): Promise<CategoryResult<{ branch: number }>> => {
    const { data: branch, error } = await getSupabase().rpc(
      'add_category_pause',
      { category: data.id, archive_from: data.from, active_from: data.until },
    )
    return error ? failure('pause', error) : { ok: true, branch }
  })

/** Its archived parents come back with it; returns how many did. */
export const reactivateCategory = createServerFn({ method: 'POST' })
  .validator(datedInput)
  .handler(async ({ data }): Promise<CategoryResult<{ parents: number }>> => {
    const { data: parents, error } = await getSupabase().rpc(
      'reactivate_category',
      { category: data.id, active_from: data.from },
    )
    return error ? failure('reactivate', error) : { ok: true, parents }
  })

/** Children block it on the foreign key; transactions will too, with their migration. */
export const deleteCategory = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<CategoryResult> => {
    const error = await deleteRow('categories', data.id)
    if (error) return failure('delete', error)
    const recolorError = await recolor()
    if (recolorError) failed('categories', 'recolor', recolorError.code)
    return { ok: true }
  })
