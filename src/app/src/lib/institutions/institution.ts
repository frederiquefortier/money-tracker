import { z } from 'zod'
import { nameSchema } from '#/lib/shared/validation'

// Shared by the Institutions screens, the account and holding forms and the server (ACC-05).

export type Institution = {
  id: string
  name: string
  websiteUrl: string | null
}

/** An institution with what uses it, for the Réglages list. */
export type InstitutionRow = Institution & {
  accountCount: number
  holdingCount: number
}

export type InstitutionError = 'nameTaken' | 'inUse' | 'notFound' | 'failed'

export const institutionFormSchema = z.object({
  name: nameSchema,
  websiteUrl: z
    .string()
    .trim()
    .max(500, { error: 'invalid' })
    .refine((url) => url === '' || /^https:\/\/\S+$/.test(url), {
      error: 'url',
    }),
})

export const institutionInputSchema = institutionFormSchema.extend({
  id: z.uuid().optional(),
})
