import type { z } from 'zod'

/** Field name to message id. `null`: rechecked since the submit and now valid. */
export type FieldErrors = Partial<Record<string, string | null>>

/** A sheet form's state: what was typed, its errors, and whether the save failed. */
export type FormState<TValues> = {
  values: TValues
  errors: FieldErrors
  failed: boolean
}

// Save failures that belong under one field.
const FIELD_FAILURES: Partial<Record<string, string>> = {
  nameTaken: 'name',
  dateTaken: 'onDate',
  balanceMatches: 'realBalance',
}

/** A failure with a field shows under it, as a taken name; any other above the buttons. */
export function savedState<TValues>(
  values: TValues,
  result: { ok: true } | { ok: false; error: string },
): FormState<TValues> {
  if (result.ok) return { values, errors: {}, failed: false }
  const field = FIELD_FAILURES[result.error]
  return field
    ? { values, errors: { [field]: result.error }, failed: false }
    : { values, errors: {}, failed: true }
}

type Validated<T> =
  { data: T; errors: null } | { data: null; errors: FieldErrors }

export function validate<TSchema extends z.ZodType>(
  schema: TSchema,
  values: unknown,
): Validated<z.output<TSchema>> {
  const result = schema.safeParse(values)
  if (result.success) return { data: result.data, errors: null }
  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '')
    errors[field] ??= issue.message
  }
  return { data: null, errors }
}

export function formValues<TName extends string>(
  form: FormData,
  names: ReadonlyArray<TName>,
): Record<TName, string> {
  return Object.fromEntries(
    names.map((n) => [n, String(form.get(n) ?? '').trim()]),
  ) as Record<TName, string>
}
