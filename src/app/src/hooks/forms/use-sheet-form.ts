import { useActionState } from 'react'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { formValues, savedState, validate } from '#/lib/forms/form-state'
import type { FormState } from '#/lib/forms/form-state'
import { useToast } from '#/hooks/app/use-toast'
import {
  useFieldValidation,
  useFocusFirstError,
} from '#/hooks/forms/use-validation'
import { useCloseSheet } from '#/hooks/forms/use-sheet'

type Outcome = { ok: true } | { ok: false; error: string }

/** What a FormField needs from the form: its value, its error, its events. */
export type FieldBinding = {
  name: string
  defaultValue: string
  error: string | undefined
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Every RouteSheet form (SET-07): validate, save, then a toast and the sheet closes. A
 * failure, a network error included, keeps what was typed; a taken name shows under the
 * name field. Errors are rechecked per field, and focus goes to the first one.
 */
export function useSheetForm<
  TSchema extends z.ZodObject,
  TValues extends Record<string, string | boolean>,
>({
  schema,
  initial,
  read = (form) => formValues<string>(form, Object.keys(initial)) as TValues,
  save,
  savedText,
}: {
  schema: TSchema
  initial: TValues
  /** The values from the form; by default the trimmed text of each key of `initial`. */
  read?: (form: FormData) => TValues
  save: (data: z.output<TSchema>, values: TValues) => Promise<Outcome>
  savedText: string
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const closeSheet = useCloseSheet()
  const [state, action, pending] = useActionState(
    async (
      _: FormState<TValues>,
      form: FormData,
    ): Promise<FormState<TValues>> => {
      const values = read(form)
      const checked = validate(schema, values)
      if (checked.errors)
        return { values, errors: checked.errors, failed: false }
      const result = await save(checked.data, values).catch((): Outcome => ({
        ok: false,
        error: 'failed',
      }))
      if (result.ok) {
        toast({ text: savedText })
        closeSheet()
      }
      return savedState(values, result)
    },
    { values: initial, errors: {}, failed: false } as FormState<TValues>,
  )
  const fields = useFieldValidation(schema, state.errors)
  const formRef = useFocusFirstError(state.errors)

  return {
    values: state.values,
    field: (name: keyof TValues & string): FieldBinding => ({
      name,
      defaultValue: String(state.values[name]),
      error: fields.error(name),
      onBlur: fields.onBlur,
      onChange: fields.onChange,
    }),
    /** Spread on SheetForm. */
    formProps: {
      action,
      formRef,
      pending,
      error: state.failed ? t('common.saveFailed') : undefined,
    },
  }
}
