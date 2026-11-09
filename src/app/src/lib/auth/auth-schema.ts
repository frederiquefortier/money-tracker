import { z } from 'zod'
import { PASSWORD_MIN_LENGTH } from '#/lib/shared/validation'

// The sign-in, password and code forms. Messages are ids under `validation.`.

export const EMAIL_LINK_TYPES = ['invite', 'recovery'] as const

export const emailSchema = z.email({ error: 'email' })

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: 'passwordRule' })
  .max(72, { error: 'passwordRule' })
  .regex(/\p{L}/u, { error: 'passwordRule' })
  .regex(/\p{N}/u, { error: 'passwordRule' })

export const totpCodeSchema = z.string().regex(/^\d{6}$/, { error: 'code' })

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, { error: 'required' })
    .max(256, { error: 'invalid' }),
})

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string().min(1, { error: 'required' }),
  })
  .refine((d) => d.password === d.confirm, {
    error: 'mismatch',
    path: ['confirm'],
  })

export const totpFormSchema = z.object({ code: totpCodeSchema })
