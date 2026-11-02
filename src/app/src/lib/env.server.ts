import '@tanstack/react-start/server-only'
import { z } from 'zod'

const schema = z.object({
  SUPABASE_URL: z.url(),
  // The secret key is never read here (security.md).
  SUPABASE_PUBLISHABLE_KEY: z.string().startsWith('sb_publishable_'),
})

let cached: z.infer<typeof schema> | undefined

export function serverEnv() {
  cached ??= schema.parse(process.env)
  return cached
}
