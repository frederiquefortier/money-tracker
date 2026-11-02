import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ComingSoon } from '#/components/coming-soon'

export const Route = createFileRoute('/_authed/budget')({ component: Budget })

function Budget() {
  const { t } = useTranslation()
  return <ComingSoon title={t('nav.budget')} text={t('comingSoon.budget')} />
}
