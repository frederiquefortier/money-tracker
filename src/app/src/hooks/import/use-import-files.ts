import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '#/hooks/app/use-toast'
import {
  importFileName,
  importInputOf,
  readImportFile,
} from '#/lib/import/import-files'
import type { ImportFileRead } from '#/lib/import/import-files'

/** The CSV files chosen, read in the browser and never uploaded (import.md). */
export function useImportFiles() {
  const { t } = useTranslation()
  const toast = useToast()
  const [files, setFiles] = useState<ReadonlyArray<ImportFileRead>>([])
  const input = useMemo(() => importInputOf(files), [files])

  async function pick(chosen: ReadonlyArray<File>) {
    const read: Array<ImportFileRead> = []
    for (const file of chosen) {
      const name = importFileName(file.name)
      if (name) read.push(readImportFile(name, await file.text()))
      else toast({ text: t('import.unknownFile', { name: file.name }) })
    }
    // A file chosen again replaces the one of the same name.
    setFiles((kept) => [
      ...kept.filter((k) => !read.some((r) => r.name === k.name)),
      ...read,
    ])
  }

  return {
    files,
    input,
    errors: files.flatMap((file) => file.errors),
    hasTransactions: files.some((file) => file.name === 'transactions'),
    pick,
    remove: (name: ImportFileRead['name']) =>
      setFiles((kept) => kept.filter((file) => file.name !== name)),
    clear: () => setFiles([]),
  }
}
