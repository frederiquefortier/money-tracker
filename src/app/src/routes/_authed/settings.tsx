import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { signOut } from '#/server/session'

export const Route = createFileRoute('/_authed/settings')({
  component: Settings,
})

function Settings() {
  const { t } = useTranslation()
  const router = useRouter()
  const { session } = Route.useRouteContext()

  async function leave() {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/sign-in' })
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
      <Card>
        <CardContent className="flex flex-col divide-y">
          <div className="pb-4">
            <p className="text-sm text-muted-foreground">
              {t('settings.signedInAs')}
            </p>
            <p className="font-semibold break-all">{session.user?.email}</p>
          </div>
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => void leave()}
            >
              <Icon name="log-out" className="size-4" />
              {t('common.signOut')}
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        {t('comingSoon.settings')}
      </p>
    </div>
  )
}
