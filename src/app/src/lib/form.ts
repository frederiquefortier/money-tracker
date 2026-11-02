import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { PASSWORD_MIN_LENGTH, VALIDATION_IDS } from '#/lib/schemas'
import type { ValidationId } from '#/lib/schemas'

/** Field name to message id. `null`: rechecked since the submit and now valid. */
export type FieldErrors = Partial<Record<string, string | null>>

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

function isValidationId(value: string): value is ValidationId {
  return (VALIDATION_IDS as ReadonlyArray<string>).includes(value)
}

/** Submit errors, rechecked per field on blur and while the user corrects one. */
export function useFieldValidation(
  schema: z.ZodObject,
  submitted: FieldErrors,
) {
  const { t } = useTranslation()
  const [live, setLive] = useState<FieldErrors>({})
  const [lastSubmitted, setLastSubmitted] = useState(submitted)
  // A new submit drops the per-field results (state adjusted during render).
  if (lastSubmitted !== submitted) {
    setLastSubmitted(submitted)
    setLive({})
  }

  function current(name: string) {
    return name in live ? live[name] : submitted[name]
  }

  function check(name: string, value: string) {
    const field = schema.shape[name] as z.ZodType | undefined
    if (!field) return
    const result = field.safeParse(value.trim())
    setLive((prev) => ({
      ...prev,
      [name]: result.success
        ? null
        : (result.error.issues[0]?.message ?? 'invalid'),
    }))
  }

  return {
    error(name: string): string | undefined {
      const id = current(name)
      if (!id) return undefined
      return t(`validation.${isValidationId(id) ? id : 'invalid'}`, {
        min: PASSWORD_MIN_LENGTH,
      })
    },
    onBlur(event: React.FocusEvent<HTMLInputElement>) {
      // Not an empty field the user only tabbed through.
      if (event.target.value) check(event.target.name, event.target.value)
    },
    onChange(event: React.ChangeEvent<HTMLInputElement>) {
      if (current(event.target.name))
        check(event.target.name, event.target.value)
    },
  }
}
