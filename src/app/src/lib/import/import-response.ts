import { z } from 'zod'
import { EMPTY_WILL_CREATE } from '#/lib/import/import'
import type { ImportCheck, ImportCounts, ImportDone } from '#/lib/import/import'

// The answers of `import_batch`, which reach the server as untyped JSON (ADR-036).

const errorSchema = z.object({
  file: z.string(),
  line: z.number(),
  code: z.string(),
  detail: z.string().nullable(),
})

const countsSchema = z.object({
  transactions: z.number(),
  skipped: z.number(),
  splits: z.number(),
  people_lines: z.number(),
  transfers: z.number(),
  reimbursements: z.number(),
  aliases: z.number(),
})

const namedAccount = z.object({
  name: z.string(),
  institution: z.string().nullable(),
})

const willCreateSchema = z.object({
  currencies: z.array(z.string()),
  institutions: z.array(z.string()),
  accounts: z.array(namedAccount),
  account_changes: z.array(namedAccount),
  categories: z.array(z.string()),
  merchants: z.array(z.string()),
  counterparties: z.array(z.string()),
  people: z.array(z.string()),
  events: z.array(z.string()),
})

const refusedSchema = z.object({
  ok: z.literal(false),
  error_count: z.number(),
  errors: z.array(errorSchema),
})

const checkedSchema = z.object({
  ok: z.literal(true),
  nothing_to_import: z.boolean().optional(),
  will_create: willCreateSchema.optional(),
  counts: countsSchema,
})

const doneSchema = z.object({
  ok: z.literal(true),
  batch_id: z.string(),
  created: z.record(z.string(), z.number()),
  counts: countsSchema,
})

function countsOf(c: z.infer<typeof countsSchema>): ImportCounts {
  return {
    transactions: c.transactions,
    skipped: c.skipped,
    splits: c.splits,
    peopleLines: c.people_lines,
    transfers: c.transfers,
    reimbursements: c.reimbursements,
    aliases: c.aliases,
  }
}

function refusal(r: z.infer<typeof refusedSchema>): ImportCheck {
  return {
    ok: false,
    errorCount: r.error_count,
    errors: r.errors.map((e) => ({ ...e, detail: e.detail ?? '' })),
  }
}

/** The answer of `import_batch` with `dry_run`; null when it is not one. */
export function parseImportCheck(json: unknown): ImportCheck | null {
  const refused = refusedSchema.safeParse(json)
  if (refused.success) return refusal(refused.data)
  const checked = checkedSchema.safeParse(json)
  if (!checked.success) return null
  const { will_create: w, counts } = checked.data
  return {
    ok: true,
    nothingToImport: checked.data.nothing_to_import ?? false,
    counts: countsOf(counts),
    willCreate: w
      ? {
          currencies: w.currencies,
          institutions: w.institutions,
          accounts: w.accounts,
          accountChanges: w.account_changes,
          categories: w.categories,
          merchants: w.merchants,
          counterparties: w.counterparties,
          people: w.people,
          events: w.events,
        }
      : EMPTY_WILL_CREATE,
  }
}

/** The answer of `import_batch` for real: the batch written, or what refused it. */
export function parseImportDone(
  json: unknown,
): ImportDone | ImportCheck | null {
  const done = doneSchema.safeParse(json)
  if (done.success) {
    return {
      ok: true,
      batchId: done.data.batch_id,
      created: done.data.created,
      counts: countsOf(done.data.counts),
    }
  }
  return parseImportCheck(json)
}
