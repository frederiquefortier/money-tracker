import { useMemo } from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { I18nextProvider } from 'react-i18next'
import { RouteProgress } from '#/components/layout/route-progress'
import { createI18n, loadTranslations } from '#/i18n'
import { useKeyboardFocus } from '#/hooks/app/use-keyboard-focus'
import { getSession } from '#/server/session'
import { keepSession, keptSession } from '#/lib/auth/session'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  beforeLoad: async () => {
    let session = keptSession()
    if (!session) {
      session = await getSession()
      keepSession(session)
    }
    await loadTranslations(session.locale)
    return { session }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'robots', content: 'noindex, nofollow' },
      { title: 'Money Tracker' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { session } = Route.useRouteContext()
  const i18n = useMemo(() => createI18n(session.locale), [session.locale])
  useKeyboardFocus()

  return (
    <html lang={session.locale}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <I18nextProvider i18n={i18n}>
          <RouteProgress />
          {children}
        </I18nextProvider>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
