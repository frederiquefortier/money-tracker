import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { forgotPasswordSchema, passwordSchema } from '#/lib/schemas'
import { getSupabase } from '#/lib/supabase.server'

export const EMAIL_LINK_TYPES = ['invite', 'recovery'] as const

/** Spends an invitation or reset token and opens an aal1 session. POST only: email link
 *  scanners follow GET links and would consume the token before the person clicks. */
export const verifyEmailLink = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      tokenHash: z.string().min(1).max(256),
      type: z.enum(EMAIL_LINK_TYPES),
    }),
  )
  .handler(async ({ data }) => {
    const { error } = await getSupabase().auth.verifyOtp({
      type: data.type,
      token_hash: data.tokenHash,
    })
    return error ? { ok: false as const } : { ok: true as const }
  })

/** Sends the reset email. Always reports success, so the form never reveals which
 *  addresses have an account. */
export const requestPasswordReset = createServerFn({ method: 'POST' })
  .validator(forgotPasswordSchema)
  .handler(async ({ data }) => {
    // The link is built by the recovery template from the project's site URL.
    await getSupabase().auth.resetPasswordForEmail(data.email)
  })

export const setPassword = createServerFn({ method: 'POST' })
  .validator(z.object({ password: passwordSchema }))
  .handler(async ({ data }) => {
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user)
      return { ok: false as const, error: 'genericError' as const }

    // Once a second factor exists, changing the password needs it, including after a reset
    // link: a stolen inbox alone is not enough to take the account.
    const [{ data: level }, { data: factors }] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ])
    if ((factors?.totp.length ?? 0) > 0 && level?.currentLevel !== 'aal2') {
      return { ok: false as const, error: 'genericError' as const }
    }

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })
    if (!error) return { ok: true as const }
    if (error.code === 'weak_password')
      return { ok: false as const, error: 'weakPassword' as const }
    if (error.code === 'same_password')
      return { ok: false as const, error: 'samePassword' as const }
    return { ok: false as const, error: 'genericError' as const }
  })
