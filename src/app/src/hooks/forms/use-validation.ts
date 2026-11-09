import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { PASSWORD_MIN_LENGTH, VALIDATION_IDS } from '#/lib/shared/validation'
import type { FieldErrors } from '#/lib/forms/form-state'
import { isOneOf } from '#/lib/shared/collections'

const isValidationId = isOneOf(VALIDATION_IDS)

/** A validation id's message; undefined when there is no error. */
export function useValidationMessage() {
  const { t } = useTranslation()
  return (id: string | null | undefined): string | undefined =>
    id
      ? t(`validation.${isValidationId(id) ? id : 'invalid'}`, {
          min: PASSWORD_MIN_LENGTH,
        })
      : undefined
}

/** Submit errors, rechecked per field on blur and while the user corrects one. */
export function useFieldValidation(
  schema: z.ZodObject,
  submitted: FieldErrors,
) {
  const message = useValidationMessage()
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
      return message(current(name))
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

/**
 * After a submit with errors, moves focus to the first invalid field (WCAG 3.3.1), so a
 * keyboard or screen reader user lands on what needs fixing. Attach the ref to the form.
 */
export function useFocusFirstError(submitted: FieldErrors) {
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (!Object.values(submitted).some(Boolean)) return
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus()
  }, [submitted])
  return formRef
}
