import { Link, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { MessageCard } from '#/components/layout/message-card'
import { Button } from '#/components/ui/button'

/** The router's default error screen: a loader or a render threw. */
export function RouteError({ reset }: ErrorComponentProps) {
  const { t } = useTranslation()
  const router = useRouter()
  return (
    <MessageCard
      icon="circle-warning"
      title={t('fallback.errorTitle')}
      text={t('fallback.errorText')}
    >
      <Button
        onClick={() => {
          reset()
          void router.invalidate()
        }}
      >
        {t('fallback.retry')}
      </Button>
    </MessageCard>
  )
}

export function RouteNotFound() {
  const { t } = useTranslation()
  return (
    <MessageCard
      icon="circle-warning"
      title={t('fallback.notFoundTitle')}
      text={t('fallback.notFoundText')}
    >
      <Button asChild>
        <Link to="/">{t('fallback.home')}</Link>
      </Button>
    </MessageCard>
  )
}
