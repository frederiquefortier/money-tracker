import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AppNav } from '#/components/app-nav'
import { LocaleSwitcher } from '#/components/locale-switcher'
import { Logo } from '#/components/logo'

// The UI guard. The real one is RLS: an aal1 session reads nothing (security.md).
export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    if (!context.session.user) throw redirect({ to: '/sign-in' })
    if (context.session.aal !== 'aal2') throw redirect({ to: '/mfa' })
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-20 border-b bg-card/80 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Logo name={t('app.name')} />
          <div className="hidden md:block">
            <AppNav variant="top" />
          </div>
          <LocaleSwitcher />
        </div>
      </header>
      <main className="px-4 py-6 md:px-6">
        <Outlet />
      </main>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <AppNav variant="bottom" />
      </div>
    </div>
  )
}
