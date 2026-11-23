import { useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { useRefresh } from '#/hooks/app/use-refresh'
import { useToast } from '#/hooks/app/use-toast'
import type { Result } from '#/lib/shared/result'

type Outcome = Result<string>

export type ServerActionOptions = {
  /** Runs first, saved or not: close a dialog, drop an optimistic change. */
  onResult?: (ok: boolean) => void
  /** The toast for a failure; the generic one when it returns undefined. */
  failureText?: (error: string) => string | undefined
}

/**
 * Every write from a list: the call runs in a transition, a success refreshes the
 * loaders, a failure (or a network error) shows a toast. The refresh blocks (ADR-065):
 * in the background it would end before the new data, and the page bar would not show.
 */
export function useServerAction() {
  const { t } = useTranslation()
  const refresh = useRefresh()
  const toast = useToast()
  const [busy, startTransition] = useTransition()

  function run(
    call: () => Promise<Outcome>,
    options: ServerActionOptions = {},
  ) {
    startTransition(async () => {
      const result = await call().catch((): Outcome => ({
        ok: false,
        error: 'failed',
      }))
      options.onResult?.(result.ok)
      if (result.ok) {
        await refresh()
        return
      }
      toast({
        text: options.failureText?.(result.error) ?? t('common.saveFailed'),
      })
    })
  }

  return { run, busy }
}
