import type { Locale } from '#/i18n/locales'

export type Session = {
  locale: Locale
  user: { email: string } | null
  aal: 'aal1' | 'aal2' | null
  hasTotp: boolean
  /** Privacy mode (SET-08): figures show as bullets. */
  figuresHidden: boolean
}

/** Set while privacy mode is on, so the server renders the page already hidden. */
export const FIGURES_HIDDEN_COOKIE = 'figures-hidden'

// The root's beforeLoad asked the server before every page and every refresh. A signed-in
// session is kept in the browser for a few minutes instead. It only gates the screens:
// each server function still runs with the cookie, and RLS decides what comes back.
const KEEP_MS = 5 * 60_000
let kept: { session: Session; at: number } | null = null

export function keptSession(): Session | null {
  if (typeof window === 'undefined' || !kept) return null
  return Date.now() - kept.at < KEEP_MS ? kept.session : null
}

/** Only a full (aal2) session is kept; sign-in and MFA screens always ask the server. */
export function keepSession(session: Session) {
  if (typeof window === 'undefined') return
  kept = session.aal === 'aal2' ? { session, at: Date.now() } : null
}

export function forgetSession() {
  kept = null
}
