import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '#/hooks/app/use-toast'

/** The generic error toast when a read fails. */
export function useFailedToast(failed: boolean, tone?: 'error') {
  const { t } = useTranslation()
  const toast = useToast()
  useEffect(() => {
    if (failed) toast({ text: t('common.genericError'), tone })
  }, [failed, tone, toast, t])
}
