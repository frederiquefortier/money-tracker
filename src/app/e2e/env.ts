// The suite creates a user and imports data, so it only ever talks to a local stack
// (ADR-044). A hosted project holds the owner's account (ADR-021).
function required(name: string): string {
  const value = process.env[name]
  if (!value)
    throw new Error(`${name} is not set. See docs/01_building/setup.md.`)
  return value
}

export function e2eEnv() {
  const url = required('E2E_SUPABASE_URL')
  const host = new URL(url).hostname
  if (host !== '127.0.0.1' && host !== 'localhost')
    throw new Error(`E2E_SUPABASE_URL must be a local stack, got ${host}.`)
  return {
    url,
    publishableKey: required('E2E_PUBLISHABLE_KEY'),
    secretKey: required('E2E_SECRET_KEY'),
  }
}
