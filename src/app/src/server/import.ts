import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { loaded } from '#/lib/server/db.server'
import { getSupabase } from '#/lib/server/supabase.server'
import { importInputSchema } from '#/lib/import/import'
import type {
  ImportBatch,
  ImportCheck,
  ImportDone,
  ImportError,
  ImportErrorItem,
  ImportTargets,
} from '#/lib/import/import'
import { parseImportCheck, parseImportDone } from '#/lib/import/import-response'
import { failureFor } from '#/lib/shared/result'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'

// IMP-01, 05, 06 (spec 18): the files are read in the browser and arrive here as rows;
// `import_batch` checks them and writes them in one transaction (ADR-036).

const KNOWN: Partial<Record<string, ImportError>> = {
  // The API gives a statement a few seconds; a file too long for one call.
  '57014': 'timeout',
  // import_undo raises it for a batch the user cannot see, or already undone.
  P0002: 'notFound',
}

const failure = failureFor('import', KNOWN)

export type CommitResult =
  | { ok: true; done: ImportDone }
  | {
      ok: false
      error: ImportError | 'nothing'
      /** The database's error code, to say why (never a value from the files). */
      code?: string
    }
  | {
      ok: false
      error: 'invalid'
      errors: Array<ImportErrorItem>
      errorCount: number
    }

/** The check that writes nothing: what is wrong, or what would be created. */
export const checkImport = createServerFn({ method: 'POST' })
  .validator(importInputSchema)
  .handler(
    async ({ data }): Promise<Result<ImportError, { check: ImportCheck }>> => {
      const { data: answer, error } = await getSupabase().rpc('import_batch', {
        payload: data,
        dry_run: true,
      })
      if (error) return failure('check', error)
      const check = parseImportCheck(answer)
      return check ? { ok: true, check } : failure('check', { code: 'shape' })
    },
  )

/** The import itself: one call, all or nothing. */
export const commitImport = createServerFn({ method: 'POST' })
  .validator(importInputSchema)
  .handler(async ({ data }): Promise<CommitResult> => {
    const { data: answer, error } = await getSupabase().rpc('import_batch', {
      payload: data,
      dry_run: false,
    })
    // The message of a check or of our own errors names a rule, never a value.
    if (error) {
      return {
        ...failure('commit', error),
        code: `${error.code}: ${error.message}`,
      }
    }
    const outcome = parseImportDone(answer)
    if (!outcome) {
      return { ...failure('commit', { code: 'shape' }), code: 'shape' }
    }
    if ('batchId' in outcome) return { ok: true, done: outcome }
    if (!outcome.ok) {
      return {
        ok: false,
        error: 'invalid',
        errors: outcome.errors,
        errorCount: outcome.errorCount,
      }
    }
    return { ok: false, error: 'nothing' }
  })

/** One second after the import, so the rows it wrote are not counted as edited. */
function afterImport(committedAt: string) {
  return new Date(new Date(committedAt).getTime() + 1000).toISOString()
}

const createdSchema = z.record(z.string(), z.number())

/** The imports made, newest first, with how many of their transactions were edited since. */
export const getImports = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<ImportBatch>> => {
    const supabase = getSupabase()
    const [batches] = loaded(
      'Imports',
      await supabase
        .from('import_batches')
        .select('id, committed_at, undone_at, created_counts')
        .order('committed_at', { ascending: false }),
    )
    return Promise.all(
      batches.map(async (b) => {
        const created: ImportBatch['created'] = createdSchema
          .catch({})
          .parse(b.created_counts)
        const { count } = b.undone_at
          ? { count: 0 }
          : await supabase
              .from('transactions')
              .select('id', { count: 'exact', head: true })
              .eq('import_batch_id', b.id)
              .gt('updated_at', afterImport(b.committed_at))
        return {
          id: b.id,
          committedAt: b.committed_at,
          undoneAt: b.undone_at,
          transactions: created.transactions ?? 0,
          created,
          edited: count ?? 0,
        }
      }),
    )
  },
)

export const undoImport = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<Result<ImportError>> => {
    const { error } = await getSupabase().rpc('import_undo', { batch: data.id })
    return error ? failure('undo', error) : { ok: true }
  })

type CategoryRow = { id: string; name: string; parent_id: string | null }

function pathOf(id: string, byId: Map<string, CategoryRow>) {
  const names: Array<string> = []
  const seen = new Set<string>()
  for (
    let row = byId.get(id);
    row && !seen.has(row.id);
    row = row.parent_id ? byId.get(row.parent_id) : undefined
  ) {
    seen.add(row.id)
    names.unshift(row.name)
  }
  return names.join(' > ')
}

/** What a new item can be merged into: the names that exist, by kind (IMP-06). */
export const getImportTargets = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ImportTargets> => {
    const supabase = getSupabase()
    const [categories, merchants, people, events] = loaded(
      'Import targets',
      ...(await Promise.all([
        supabase.from('categories').select('id, name, parent_id'),
        supabase.from('merchants').select('name'),
        supabase.from('people').select('name'),
        supabase.from('events').select('name'),
      ])),
    )
    const byId = new Map(categories.map((c) => [c.id, c]))
    return {
      categories: categories.map((c) => pathOf(c.id, byId)),
      merchants: merchants.map((m) => m.name),
      people: people.map((p) => p.name),
      events: events.map((e) => e.name),
    }
  },
)
