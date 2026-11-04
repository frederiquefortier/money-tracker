import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ComingSoon } from '#/components/coming-soon'
import { FloatingAddButton } from '#/components/floating-add-button'

export const Route = createFileRoute('/_authed/transactions')({
  component: Transactions,
})

// The list itself is spec 14; until then the add button and the forms open over this.
function Transactions() {
  const { t } = useTranslation()
  return (
    <>
      <ComingSoon
        title={t('nav.transactions')}
        text={t('comingSoon.transactions')}
      />
      <FloatingAddButton to="/transactions/new" label={t('transactions.add')} />
      <Outlet />
    </>
  )
}
