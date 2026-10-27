import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { createServerEntry } from '@tanstack/react-start/server-entry'
import { SECURITY_HEADERS, contentSecurityPolicy } from '#/lib/csp'

const handle = createStartHandler(defaultStreamHandler)

function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
}

// Netlify's static headers do not reach function responses, so the server sets them.
export default createServerEntry({
  async fetch(request) {
    const nonce = newNonce()
    // Passed as request context, which the router reads (router.tsx). Rebuilding the
    // Request to carry it as a header fails: the runtime's Request has private fields.
    const response = await handle(request, { context: { nonce } })

    for (const [name, value] of Object.entries(SECURITY_HEADERS))
      response.headers.set(name, value)
    // Vite's dev server injects un-nonced inline scripts, so the CSP is production only.
    if (
      !import.meta.env.DEV &&
      response.headers.get('content-type')?.includes('text/html')
    ) {
      response.headers.set(
        'Content-Security-Policy',
        contentSecurityPolicy(nonce),
      )
    }
    return response
  },
})
