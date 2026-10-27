import { z } from 'zod'

// Mirrors [auth] in src/supabase/config.toml: minimum_password_length = 12,
// password_requirements = "letters_digits". Supabase enforces it too; this gives the form
// the same answer before the round trip. 72 is bcrypt's input limit.
export const PASSWORD_MIN_LENGTH = 12

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(72)
  .regex(/\p{L}/u)
  .regex(/\p{N}/u)
