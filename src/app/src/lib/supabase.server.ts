import '@tanstack/react-start/server-only'
import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { serverEnv } from './env.server'

// The browser never talks to Supabase (ADR-006), so the session cookies can be httpOnly.
export function getSupabase() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = serverEnv()
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () =>
        Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          setCookie(name, value, {
            ...options,
            httpOnly: true,
            secure: !import.meta.env.DEV,
            sameSite: 'lax',
          })
        }
      },
    },
  })
}
