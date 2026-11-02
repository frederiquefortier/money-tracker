import { z } from 'zod'

// Shared by forms and server functions. Messages are ids under `validation.`.

// Mirrors [auth] in config.toml. 72 is bcrypt's input limit.
export const PASSWORD_MIN_LENGTH = 12

export const VALIDATION_IDS = [
  'required',
  'email',
  'passwordRule',
  'mismatch',
  'code',
  'invalid',
] as const
export type ValidationId = (typeof VALIDATION_IDS)[number]

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
