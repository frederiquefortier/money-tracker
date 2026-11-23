import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRefresh } from '#/hooks/app/use-refresh'
import { useToast } from '#/hooks/app/use-toast'
import { withDecisions } from '#/lib/import/import-merges'
import type { Decisions } from '#/lib/import/import-merges'
import { EMPTY_WILL_CREATE } from '#/lib/import/import'
import type {
  ImportCheck,
  ImportDone,
  ImportErrorItem,
  ImportInput,
} from '#/lib/import/import'
import { checkImport, commitImport } from '#/server/import'

type Checked = { input: ImportInput; check: ImportCheck }

/** What the database refused when importing, with the choices made: shown on the summary. */
type Refusal = { errors: Array<ImportErrorItem>; count: number }

/**
 * Checking the rows, the merges chosen for what is new (IMP-06), and the import itself.
 * A check belongs to the rows it was made on: other files, no check.
 */
export function useImportRun(input: ImportInput, decisions: Decisions) {
  const { t } = useTranslation()
  const toast = useToast()
  const refresh = useRefresh()
  const [checked, setChecked] = useState<Checked | null>(null)
  const [busy, setBusy] = useState<'checking' | 'importing' | null>(null)
  const [done, setDone] = useState<ImportDone | null>(null)
  const [refusal, setRefusal] = useState<Refusal | null>(null)
  const check = checked?.input === input ? checked.check : null

  // Leaving the page while it writes would hide how it ended.
  useEffect(() => {
    if (busy !== 'importing') return
    const stop = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', stop)
    return () => window.removeEventListener('beforeunload', stop)
  }, [busy])

  async function runCheck() {
    setBusy('checking')
    setDone(null)
    const result = await checkImport({ data: input }).catch(
      (error: unknown) => {
        console.error(
          '[import] check request failed:',
          error instanceof Error ? error.name : 'unknown',
        )
        return null
      },
    )
    setBusy(null)
    if (result?.ok) {
      setChecked({ input, check: result.check })
    } else {
      const code = result && 'code' in result ? result.code : 'request'
      toast({ text: `${t('import.checkFailed')} (${code})` })
    }
  }

  async function runImport() {
    setBusy('importing')
    setRefusal(null)
    const will = check?.ok ? check.willCreate : EMPTY_WILL_CREATE
    const result = await commitImport({
      data: withDecisions(input, will, decisions),
    }).catch((error: unknown) => {
      // Only the kind of error, never what was in the files.
      console.error(
        '[import] commit request failed:',
        error instanceof Error ? error.name : 'unknown',
      )
      return null
    })
    setBusy(null)
    if (result?.ok) {
      setDone(result.done)
      await refresh()
    } else if (result?.error === 'invalid') {
      setRefusal({ errors: result.errors, count: result.errorCount })
    } else {
      const text = t(
        result?.error === 'timeout' ? 'import.timeout' : 'import.wroteNothing',
      )
      const code = result && 'code' in result ? result.code : 'request'
      toast({ text: code ? `${text} (${code})` : text })
    }
  }

  return {
    check,
    refusal,
    busy,
    done,
    runCheck,
    runImport,
    dismissDone: () => setDone(null),
    /** Back to the files, keeping them and what was decided. */
    reset: () => {
      setChecked(null)
      setRefusal(null)
    },
    dismissRefusal: () => setRefusal(null),
  }
}
