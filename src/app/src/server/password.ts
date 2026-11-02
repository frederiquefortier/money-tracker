import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { forgotPasswordSchema, passwordSchema } from '#/lib/schemas'
import { getSupabase } from '#/lib/supabase.server'

export const EMAIL_LINK_TYPES = ['invite', 'recovery'] as const

// POST: email scanners follow GET links and would spend the token.
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

// Always succeeds, so the form never reveals which addresses have an account.
export const requestPasswordReset = createServerFn({ method: 'POST' })
  .validator(forgotPasswordSchema)
  .handler(async ({ data }) => {
    await getSupabase().auth.resetPasswordForEmail(data.email)
  })

export const setPassword = createServerFn({ method: 'POST' })
  .validator(z.object({ password: passwordSchema }))
  .handler(async ({ data }) => {
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user)
      return { ok: false as const, error: 'genericError' as const }

    // Once a factor exists, aal2 is required, even after a reset link.
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
