import { createServerFn } from '@tanstack/react-start'
import {
  getCookie,
  getRequestHeader,
  setCookie,
} from '@tanstack/react-start/server'
import { z } from 'zod'
import { signInSchema, totpCodeSchema } from '#/lib/schemas'
import { LOCALES, LOCALE_COOKIE, isLocale, resolveLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import type { Result } from '#/lib/result'
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

    // Checked locally against the JWKS (ADR-018). A session revoked elsewhere stays valid
    // until jwt_expiry.
    const { data } = await supabase.auth.getClaims()
    const claims = data?.claims
    if (!claims) return { locale, user: null, aal: null, hasTotp: false }

    const aal = claims.aal === 'aal2' ? 'aal2' : 'aal1'
    // aal2 implies a verified TOTP; only aal1 has to ask Auth.
    const hasTotp =
      aal === 'aal2' ||
      ((await supabase.auth.mfa.listFactors()).data?.totp.length ?? 0) > 0

    return { locale, user: { email: claims.email ?? '' }, aal, hasTotp }
  },
)

export const setLocale = createServerFn({ method: 'POST' })
  .validator(z.object({ locale: z.enum(LOCALES) }))
  .handler(async ({ data }): Promise<Result<never>> => {
    writeLocaleCookie(data.locale)
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getClaims()
    // aal1 cannot write the profile (MFA policy); the cookie still applies.
    if (auth?.claims) {
      const { error } = await supabase
        .from('profiles')
        .update({ locale: data.locale })
        .eq('user_id', auth.claims.sub)
      if (error) console.error('[profile] locale not saved:', error.code)
    }
    return { ok: true }
  })

type SignInResult = Result<
  'invalidCredentials' | 'tooManyAttempts' | 'genericError'
>

type Enrollment = { factorId: string; qrCode: string; secret: string }

export const signIn = createServerFn({ method: 'POST' })
  .validator(signInSchema)
  .handler(async ({ data }): Promise<SignInResult> => {
    const { error } = await getSupabase().auth.signInWithPassword(data)
    if (!error) return { ok: true }
    // One code for wrong password and unknown email: accounts cannot be enumerated.
    // Other failures are logged as a code, never with the email.
    if (error.code === 'invalid_credentials') {
      return { ok: false, error: 'invalidCredentials' }
    }
    console.error(
      '[auth] sign-in failed:',
      error.code ?? error.name,
      error.status ?? '',
    )
    if (error.code === 'over_request_rate_limit') {
      return { ok: false, error: 'tooManyAttempts' }
    }
    return { ok: false, error: 'genericError' }
  })

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  await getSupabase().auth.signOut()
})

export const startTotpEnrollment = createServerFn({ method: 'POST' }).handler(
  async (): Promise<Result<'failed', Enrollment>> => {
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { ok: false, error: 'failed' }

    const { data: factors } = await supabase.auth.mfa.listFactors()
    if (!factors || factors.totp.length > 0)
      return { ok: false, error: 'failed' }

    // An abandoned enrolment leaves an unverified factor.
    for (const factor of factors.all) {
      if (factor.factor_type === 'totp' && factor.status === 'unverified') {
        await supabase.auth.mfa.unenroll({ factorId: factor.id })
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    })
    if (error) return { ok: false, error: 'failed' }
    return {
      ok: true,
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    }
  },
)

/** With a factorId, finishes an enrolment; without, answers the sign-in challenge. */
export const verifyTotp = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      factorId: z.uuid().optional(),
      code: totpCodeSchema,
    }),
  )
  .handler(async ({ data }): Promise<Result<'invalidCode'>> => {
    const supabase = getSupabase()
    const factorId =
      data.factorId ?? (await supabase.auth.mfa.listFactors()).data?.totp[0]?.id
    if (!factorId) return { ok: false, error: 'invalidCode' }

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: data.code,
    })
    if (error) return { ok: false, error: 'invalidCode' }

    // Now aal2: the saved locale wins over the browser's.
    const { data: profile } = await supabase
      .from('profiles')
      .select('locale')
      .single()
    const saved = isLocale(profile?.locale) ? profile.locale : undefined
    if (saved) writeLocaleCookie(saved)
    return { ok: true }
  })
