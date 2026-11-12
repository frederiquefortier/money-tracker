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
  'amount',
  'date',
  'url',
  'nameTaken',
  'dateTaken',
  'splitsSum',
  'percentTotal',
  'duplicateCategory',
  'sameAccount',
  'feeCategoryUnset',
  'balanceMatches',
] as const
export type ValidationId = (typeof VALIDATION_IDS)[number]

/** The input of a server function that acts on one row. */
export const idInput = z.object({ id: z.uuid() })

/** The name of anything the user names: an account, a category, a merchant, a person. */
export const nameSchema = z
  .string()
  .trim()
  .min(1, { error: 'required' })
  .max(100, { error: 'invalid' })

/** A sheet form whose only typed field is the name. */
export const nameFormSchema = z.object({ name: nameSchema })

export const noteSchema = z.string().trim().max(1000)
