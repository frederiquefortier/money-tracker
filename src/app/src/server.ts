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

// Covers login CSRF, which SameSite=lax does not.
function isCrossSiteWrite(request: Request): boolean {
  if (request.method === 'GET' || request.method === 'HEAD') return false
  const site = request.headers.get('sec-fetch-site')
  return site === 'cross-site' || site === 'same-site'
}

// Netlify's static headers do not reach function responses, so the server sets them.
export default createServerEntry({
  async fetch(request) {
    if (isCrossSiteWrite(request))
      return new Response(null, { status: 403, headers: SECURITY_HEADERS })

    const nonce = newNonce()
    // Context, not a header: the runtime's Request has private fields and cannot be rebuilt.
    const response = await handle(request, { context: { nonce } })

    for (const [name, value] of Object.entries(SECURITY_HEADERS))
      response.headers.set(name, value)
    if (!response.headers.has('cache-control'))
      response.headers.set('Cache-Control', 'private, no-store')
    // Vite's dev server injects inline scripts without the nonce.
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
