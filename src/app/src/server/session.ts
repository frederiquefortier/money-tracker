import { createServerFn } from '@tanstack/react-start'
import {
  getCookie,
  getRequestHeader,
  setCookie,
} from '@tanstack/react-start/server'
import { z } from 'zod'
import { LOCALES, LOCALE_COOKIE, isLocale, resolveLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { getSupabase } from '#/lib/supabase.server'

export type Session = {
  locale: Locale
  user: { email: string } | null
  aal: 'aal1' | 'aal2' | null
  hasTotp: boolean
}

const ONE_YEAR = 60 * 60 * 24 * 365

function writeLocaleCookie(locale: Locale) {
  setCookie(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: ONE_YEAR,
    httpOnly: true,
    secure: !import.meta.env.DEV,
    sameSite: 'lax',
  })
}

export const getSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Session> => {
    const locale = resolveLocale(
      getCookie(LOCALE_COOKIE),
      getRequestHeader('accept-language'),
    )
    const supabase = getSupabase()

    // Verified locally against the project's public signing key (cached JWKS), so a page
    // load costs no Auth request. RLS trusts the same token the same way, so this check is
    // no weaker than the one guarding the data. A session revoked elsewhere stays valid
    // here until the token expires (jwt_expiry in config.toml).
    const { data } = await supabase.auth.getClaims()
    const claims = data?.claims
    if (!claims) return { locale, user: null, aal: null, hasTotp: false }

    const aal = claims.aal === 'aal2' ? 'aal2' : 'aal1'
    // aal2 proves a verified factor (TOTP is the only one enabled). Only an aal1 session,
    // on the MFA and set-password pages, needs Auth to say whether one exists.
    const hasTotp =
      aal === 'aal2' ||
      ((await supabase.auth.mfa.listFactors()).data?.totp.length ?? 0) > 0

    return { locale, user: { email: claims.email ?? '' }, aal, hasTotp }
  },
)

export const setLocale = createServerFn({ method: 'POST' })
  .validator(z.object({ locale: z.enum(LOCALES) }))
  .handler(async ({ data }) => {
    writeLocaleCookie(data.locale)
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getClaims()
    // An aal1 session cannot write its profile (MFA policy); the cookie still applies.
    if (auth?.claims) {
      await supabase
        .from('profiles')
        .update({ locale: data.locale })
        .eq('user_id', auth.claims.sub)
    }
  })

export const signIn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ email: z.email(), password: z.string().min(1).max(256) }),
  )
  .handler(async ({ data }) => {
    const { error } = await getSupabase().auth.signInWithPassword(data)
    // One message for every failure, so the form does not reveal which accounts exist.
    return error
      ? { ok: false as const, error: 'invalidCredentials' as const }
      : { ok: true as const }
  })

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  await getSupabase().auth.signOut()
})

/** Starts a TOTP enrolment. Only for a signed-in user with no verified factor yet. */
export const startTotpEnrollment = createServerFn({ method: 'POST' }).handler(
  async () => {
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { ok: false as const }

    const { data: factors } = await supabase.auth.mfa.listFactors()
    if (!factors || factors.totp.length > 0) return { ok: false as const }

    // An abandoned enrolment leaves an unverified factor behind; clear it before starting over.
    for (const factor of factors.all) {
      if (factor.factor_type === 'totp' && factor.status === 'unverified') {
        await supabase.auth.mfa.unenroll({ factorId: factor.id })
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    })
    if (error) return { ok: false as const }
    return {
      ok: true as const,
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    }
  },
)

/** Verifies a code, either finishing an enrolment (factorId given) or as the sign-in challenge. */
export const verifyTotp = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      factorId: z.uuid().optional(),
      code: z.string().regex(/^\d{6}$/),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getSupabase()
    const factorId =
      data.factorId ?? (await supabase.auth.mfa.listFactors()).data?.totp[0]?.id
    if (!factorId) return { ok: false as const }

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: data.code,
    })
    if (error) return { ok: false as const }

    // Now at aal2, the profile is readable: its locale wins over the browser's.
    const { data: profile } = await supabase
      .from('profiles')
      .select('locale')
      .single()
    if (isLocale(profile?.locale)) writeLocaleCookie(profile.locale)
    return { ok: true as const }
  })
