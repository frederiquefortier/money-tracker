import {
  Outlet,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LocaleSwitcher } from '#/components/locale-switcher'
import { Logo } from '#/components/logo'
import { Icon } from '#/components/icon'
import { Button } from '#/components/ui/button'
import { signOut } from '#/server/session'

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
  const router = useRouter()

  async function leave() {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/sign-in' })
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-4 border-b bg-card/70 px-4 py-3 backdrop-blur">
        <Logo name={t('app.name')} />
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => void leave()}
          >
            <Icon name="log-out" className="size-4" />
            {t('common.signOut')}
          </Button>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
