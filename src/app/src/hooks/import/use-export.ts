import { useTransition } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useFailedToast } from '#/hooks/app/use-failed-toast'
import { useToast } from '#/hooks/app/use-toast'
import type { ImportFileName } from '#/lib/import/import'
import { todayIso } from '#/lib/shared/format'
import { exportData, getExportCounts } from '#/server/export'

function download(base64: string, name: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const url = URL.createObjectURL(
    new Blob([bytes], { type: 'application/zip' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** IMP-04: builds the chosen files on the server and downloads them as one zip. */
export function useExport() {
  const { t } = useTranslation()
  const toast = useToast()
  const [busy, startTransition] = useTransition()

  function run(files: Array<ImportFileName>) {
    startTransition(async () => {
      const result = await exportData({ data: { files } }).catch(() => null)
      if (!result?.ok) {
        toast({ text: t('import.export.failed'), tone: 'error' })
        return
      }
      if (result.zip === null) {
        toast({ text: t('import.export.empty') })
        return
      }
      download(result.zip, `export-${todayIso()}.zip`)
    })
  }

  return { run, busy }
}

/** The rows of each file, fetched when the Exporter tab opens; null until then. */
export function useExportCounts() {
  const query = useQuery({
    queryKey: ['export-counts'],
    queryFn: () => getExportCounts(),
  })
  useFailedToast(query.isError)
  return query.data ?? null
}
