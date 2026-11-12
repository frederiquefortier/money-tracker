import { createServerFn } from '@tanstack/react-start'
import {
  contributionInputSchema,
  snapshotInputSchema,
} from '#/lib/holdings/holding'
import type { HoldingError } from '#/lib/holdings/holding'
import { deleteRow, saveRow } from '#/lib/server/db.server'
import { entryFailure } from '#/lib/server/holding.server'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'

type HoldingResult<T = object> = Result<HoldingError, T>

export const saveSnapshot = createServerFn({ method: 'POST' })
  .validator(snapshotInputSchema)
  .handler(async ({ data }): Promise<HoldingResult<{ id: string }>> => {
    const { saved, error } = await saveRow('holding_snapshots', data.id, {
      holding_id: data.holdingId,
      on_date: data.onDate,
      amount: data.amount,
    })
    if (error) return entryFailure('save value', error)
    if (!saved) return { ok: false, error: 'notFound' }
    return { ok: true, id: saved.id }
  })

export const deleteSnapshot = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<HoldingResult> => {
    const error = await deleteRow('holding_snapshots', data.id)
    return error ? entryFailure('delete value', error) : { ok: true }
  })

export const saveContribution = createServerFn({ method: 'POST' })
  .validator(contributionInputSchema)
  .handler(async ({ data }): Promise<HoldingResult<{ id: string }>> => {
    const { saved, error } = await saveRow('holding_contributions', data.id, {
      holding_id: data.holdingId,
      on_date: data.onDate,
      amount: data.amount,
      label: data.label || null,
    })
    if (error) return entryFailure('save contribution', error)
    if (!saved) return { ok: false, error: 'notFound' }
    return { ok: true, id: saved.id }
  })

export const deleteContribution = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<HoldingResult> => {
    const error = await deleteRow('holding_contributions', data.id)
    return error ? entryFailure('delete contribution', error) : { ok: true }
  })
