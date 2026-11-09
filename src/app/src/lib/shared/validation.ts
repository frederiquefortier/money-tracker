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
