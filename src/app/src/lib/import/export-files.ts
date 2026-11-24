import { z } from 'zod'
import { toCsv } from '#/lib/shared/csv'
import { IMPORT_FILES } from '#/lib/import/import'
import type { ImportFileName } from '#/lib/import/import'
import { IMPORT_COLUMNS } from '#/lib/import/import-files'

// IMP-04: the user's data as the import's files, so export then import gives it back.

const exportRow = z.partialRecord(z.string(), z.string().nullable())

/** What `export_data()` returns: the rows of each file, every value text or null. */
export const exportDataSchema = z.object(
  Object.fromEntries(
    IMPORT_FILES.map((name) => [name, z.array(exportRow)]),
  ) as Record<ImportFileName, z.ZodArray<typeof exportRow>>,
)
export type ExportData = z.infer<typeof exportDataSchema>

/** How many rows each file holds, for the Exporter tab. */
export const exportCountsSchema = z.object(
  Object.fromEntries(
    IMPORT_FILES.map((name) => [name, z.number().int()]),
  ) as Record<ImportFileName, z.ZodNumber>,
)
export type ExportCounts = z.infer<typeof exportCountsSchema>

export type ExportFile = { name: `${ImportFileName}.csv`; text: string }

/** The files the user ticked, in the order of import.md. */
export const exportInputSchema = z.object({
  files: z.array(z.enum(IMPORT_FILES)).min(1),
})

/** One CSV per chosen file that has rows, its columns in the order of import.md. */
export function exportFiles(
  data: ExportData,
  chosen: ReadonlyArray<ImportFileName> = IMPORT_FILES,
): Array<ExportFile> {
  return IMPORT_FILES.filter(
    (name) => chosen.includes(name) && data[name].length > 0,
  ).map((name) => ({
    name: `${name}.csv`,
    text: toCsv(
      IMPORT_COLUMNS[name].map((c) => c.name),
      data[name],
    ),
  }))
}
