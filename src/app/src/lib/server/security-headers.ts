export function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    // Hydration scripts carry the nonce; 'strict-dynamic' lets them load the app's chunks.
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    // Radix sets inline style attributes for positioning.
    "style-src 'self' 'unsafe-inline'",
    // The TOTP QR code is an SVG data URI.
    "img-src 'self' data:",
    "font-src 'self'",
    // The browser only talks to our own server functions (ADR-006).
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

export const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

// Covers login CSRF, which SameSite=lax does not.
export function isCrossSiteWrite(request: Request): boolean {
  if (request.method === 'GET' || request.method === 'HEAD') return false
  const site = request.headers.get('sec-fetch-site')
  return site === 'cross-site' || site === 'same-site'
}
