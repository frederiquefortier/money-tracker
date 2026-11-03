/** What a server function that writes returns; `error` is an id the screen translates. */
export type Result<TError extends string, T = object> =
  ({ ok: true } & T) | { ok: false; error: TError }

/** Logs a failure by its code only, never with user data. */
export function failed(scope: string, context: string, code?: string) {
  console.error(`[${scope}] ${context}:`, code ?? 'unknown')
  return { ok: false as const, error: 'failed' as const }
}
