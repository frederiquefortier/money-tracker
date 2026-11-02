import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ComingSoon } from '#/components/coming-soon'

export const Route = createFileRoute('/_authed/')({ component: Transactions })

function Transactions() {
  const { t } = useTranslation()
  return (
    <ComingSoon
      title={t('nav.transactions')}
      text={t('comingSoon.transactions')}
    />
  )
}
