import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { Result } from '#/lib/shared/result'
import { getSupabase } from '#/lib/server/supabase.server'
import {
  EMAIL_LINK_TYPES,
  forgotPasswordSchema,
  passwordSchema,
} from '#/lib/auth/auth-schema'

// POST: email scanners follow GET links and would spend the token.
export const verifyEmailLink = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      tokenHash: z.string().min(1).max(256),
      type: z.enum(EMAIL_LINK_TYPES),
    }),
  )
  .handler(async ({ data }): Promise<Result<'invalid'>> => {
    const { error } = await getSupabase().auth.verifyOtp({
      type: data.type,
      token_hash: data.tokenHash,
    })
    return error ? { ok: false, error: 'invalid' } : { ok: true }
  })

// Always succeeds, so the form never reveals which addresses have an account.
export const requestPasswordReset = createServerFn({ method: 'POST' })
  .validator(forgotPasswordSchema)
  .handler(async ({ data }) => {
    await getSupabase().auth.resetPasswordForEmail(data.email)
  })

type SetPasswordResult = Result<
  'weakPassword' | 'samePassword' | 'genericError'
>

export const setPassword = createServerFn({ method: 'POST' })
  .validator(z.object({ password: passwordSchema }))
  .handler(async ({ data }): Promise<SetPasswordResult> => {
    const supabase = getSupabase()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { ok: false, error: 'genericError' }

    // Once a factor exists, aal2 is required, even after a reset link.
    const [{ data: level }, { data: factors }] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ])
    if ((factors?.totp.length ?? 0) > 0 && level?.currentLevel !== 'aal2') {
      return { ok: false, error: 'genericError' }
    }

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })
    if (!error) return { ok: true }
    if (error.code === 'weak_password')
      return { ok: false, error: 'weakPassword' }
    if (error.code === 'same_password')
      return { ok: false, error: 'samePassword' }
    return { ok: false, error: 'genericError' }
  })
