import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { MessageCard } from '#/components/layout/message-card'

export const Route = createFileRoute('/_authed/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { t } = useTranslation()
  return (
    <MessageCard title={t('nav.dashboard')} text={t('comingSoon.dashboard')} />
  )
}
