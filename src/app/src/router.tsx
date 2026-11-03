import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { getGlobalStartContext } from '@tanstack/react-start'
import { routeTree } from './routeTree.gen'

// Set per request by the server entry (server.ts); undefined in the browser.
function getNonce() {
  return (getGlobalStartContext() as { nonce?: string } | undefined)?.nonce
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    // Data preloaded on hover is reused by the click (default preload stale time, 30 s).
    defaultPreload: 'intent',
    ssr: { nonce: getNonce() },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
