/** What a server function that writes returns; `error` is an id the screen translates. */
export type Result<TError extends string, T = object> =
  ({ ok: true } & T) | { ok: false; error: TError }

/** Logs a failure by its code only, never with user data. */
export function failed(scope: string, context: string, code?: string) {
  console.error(`[${scope}] ${context}:`, code ?? 'unknown')
  return { ok: false as const, error: 'failed' as const }
}

/**
 * Turns a database error into the id the screen translates: by SQLSTATE (`23505`), or
 * by the message a trigger or function raises (`category_not_found`). Anything else is
 * logged under `scope`.
 */
export function failureFor<TError extends string>(
  scope: string,
  known: Partial<Record<string, TError>>,
) {
  return (
    context: string,
    error: { code?: string; message?: string },
  ): { ok: false; error: TError | 'failed' } => {
    const id =
      (error.code && known[error.code]) ||
      (error.message && known[error.message])
    if (id) return { ok: false, error: id }
    return failed(scope, context, error.code)
  }
}
