import { createServerFn } from '@tanstack/react-start'
import { getSupabase } from '#/lib/server/supabase.server'
import { zipFiles } from '#/lib/server/zip.server'
import {
  exportCountsSchema,
  exportDataSchema,
  exportFiles,
  exportInputSchema,
} from '#/lib/import/export-files'
import type { ExportCounts } from '#/lib/import/export-files'
import { failed } from '#/lib/shared/result'
import type { Result } from '#/lib/shared/result'

/**
 * IMP-04: the chosen files of the import format, read with the user's own session, in one
 * zip sent as base64 (a server function answers in JSON). Null when none has rows.
 */
export const exportData = createServerFn({ method: 'POST' })
  .validator(exportInputSchema)
  .handler(
    async ({
      data: input,
    }): Promise<Result<'failed', { zip: string | null }>> => {
      const { data, error } = await getSupabase().rpc('export_data')
      if (error) return failed('export', 'rpc', error.code)
      const parsed = exportDataSchema.safeParse(data)
      if (!parsed.success) return failed('export', 'shape')
      const files = exportFiles(parsed.data, input.files)
      return {
        ok: true,
        zip: files.length > 0 ? zipFiles(files).toString('base64') : null,
      }
    },
  )

/** The rows of each file, so the tab shows what the zip will hold. */
export const getExportCounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ExportCounts> => {
    const { data, error } = await getSupabase().rpc('export_counts')
    if (error)
      throw new Error(`Export counts could not be loaded (${error.code})`)
    return exportCountsSchema.parse(data)
  },
)
