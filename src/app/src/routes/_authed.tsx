import {
  Outlet,
  createFileRoute,
  redirect,
  useChildMatches,
} from '@tanstack/react-router'
import { AppMenu } from '#/components/layout/app-menu'
import { AppNav } from '#/components/layout/app-nav'
import {
  AddButtonSlot,
  AddButtonTarget,
} from '#/components/layout/floating-add-button'
import { DisplayCurrencySwitcher } from '#/components/layout/display-currency-switcher'
import { LocaleSwitcher } from '#/components/layout/locale-switcher'
import {
  PrivacyProvider,
  PrivacySwitch,
} from '#/components/layout/privacy-switch'
import { Logo } from '#/components/layout/logo'
import { Toaster } from '#/components/feedback/toaster'
import { getMyCurrencies } from '#/server/currencies'
import { usePreloadPages } from '#/hooks/app/use-preload-pages'

// UI guard only; RLS is the real one.
export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    if (!context.session.user) throw redirect({ to: '/sign-in' })
    if (context.session.aal !== 'aal2') throw redirect({ to: '/mfa' })
  },
  // A loader, not beforeLoad: it runs beside the page's own loader instead of before it,
  // and its result is cached until a write calls router.invalidate() (ADR-011).
  loader: () => getMyCurrencies(),
  staleTime: Infinity,
  component: AuthedLayout,
})

function AuthedLayout() {
  // A page per key: navigations run in a React transition, which never swaps a boundary
  // already on screen for its fallback, so one shared boundary kept the old page until
  // the new one had its data. A new page's boundary shows its loading frame at once.
  // Sheets and filters stay on the same page, so they keep it.
  const page = useChildMatches({ select: (matches) => matches[0]?.routeId })
  usePreloadPages()
  return (
    <PrivacyProvider>
      <Toaster>
        <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <AddButtonSlot>
            <header className="sticky top-0 z-20 border-b bg-card/80 pt-[env(safe-area-inset-top)] backdrop-blur">
              <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
                <div className="flex min-w-0 items-center gap-2">
                  <AppMenu />
                  <Logo className="min-w-0" />
                </div>
                <div className="hidden md:block">
                  <AppNav variant="top" />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PrivacySwitch />
                  <DisplayCurrencySwitcher />
                  <LocaleSwitcher />
                </div>
              </div>
            </header>
            <main className="px-4 py-6 md:px-6">
              <AddButtonTarget />
              <Outlet key={page} />
            </main>
            <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
              <AppNav variant="bottom" />
            </div>
          </AddButtonSlot>
        </div>
      </Toaster>
    </PrivacyProvider>
  )
}
