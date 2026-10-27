import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authed/')({ component: Home })

function Home() {
  const { t } = useTranslation()
  const { session } = Route.useRouteContext()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">
        {t('home.greeting', { email: session.user?.email ?? '' })}
      </h1>
      <p className="mt-2 text-muted-foreground">{t('home.intro')}</p>
    </main>
  )
}
