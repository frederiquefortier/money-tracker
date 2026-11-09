import { useTransition } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
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
 * loaders, a failure (or a network error) shows a toast.
 */
export function useServerAction() {
  const { t } = useTranslation()
  const router = useRouter()
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
        await router.invalidate()
        return
      }
      toast({
        text: options.failureText?.(result.error) ?? t('common.saveFailed'),
      })
    })
  }

  return { run, busy }
}
