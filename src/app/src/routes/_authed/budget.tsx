import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { MessageCard } from '#/components/layout/message-card'

export const Route = createFileRoute('/_authed/budget')({ component: Budget })

function Budget() {
  const { t } = useTranslation()
  return <MessageCard title={t('nav.budget')} text={t('comingSoon.budget')} />
}
