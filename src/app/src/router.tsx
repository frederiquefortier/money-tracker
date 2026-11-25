import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import type { ParsedLocation } from '@tanstack/react-router'
import { getGlobalStartContext } from '@tanstack/react-start'
import { RouteError, RouteNotFound } from '#/components/layout/route-fallbacks'
import { routeTree } from './routeTree.gen'

// Set per request by the server entry (server.ts); undefined in the browser.
function getNonce() {
  return (getGlobalStartContext() as { nonce?: string } | undefined)?.nonce
}

export function getRouter() {
  // A sheet opens over the list, so opening, closing or switching sheets keeps the list
  // where it was; any other navigation restores or resets the scroll as usual.
  const opensSheet = (location: ParsedLocation): boolean =>
    router
      .matchRoutes(location)
      .some((match) => match.staticData.sheet === true)

  // One per router, so one per request on the server: no cached read crosses users. The
  // pages' data stays in the loaders; Query holds what a component fetches itself (ADR-073).
  const queryClient = new QueryClient({
    defaultOptions: {
      // The loaders' stale time; every save invalidates both (useRefresh).
      queries: { staleTime: 30_000, retry: false },
    },
  })

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: ({ location }) => !opensSheet(location),
    // Data preloaded on hover is reused by the click (default preload stale time, 30 s).
    defaultPreload: 'intent',
    // Going back to a page seen in the last 30 s shows it without loading again. Every
    // save calls router.invalidate, so a change never waits for this.
    defaultStaleTime: 30_000,
    // Translated, instead of the router's built-in English screens (ADR-008).
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: RouteNotFound,
    ssr: { nonce: getNonce() },
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
  interface StaticDataRouteOption {
    /** The route draws a RouteSheet over its parent's list. */
    sheet?: boolean
  }
}
