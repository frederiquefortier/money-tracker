import { useActionState } from 'react'
import type { FieldErrors } from '#/lib/forms/form-state'
import type { Result } from '#/lib/shared/result'
import { useToast } from '#/hooks/app/use-toast'
import { useCloseSheet } from '#/hooks/forms/use-sheet'
import { useFocusFirstError } from '#/hooks/forms/use-validation'

type State = { errors: FieldErrors; failed: boolean; submitted: boolean }

/**
 * A draft form's submit (a transaction, a transfer): check, save, then a toast and the
 * sheet closes. After a first submit, `errors` follow the fields as they are corrected.
 */
export function useDraftSubmit<TInput>({
  check,
  save,
  accountOf,
  savedText,
  onSaved,
}: {
  check: () => { input: TInput | null; errors: FieldErrors | null }
  save: (input: TInput) => Promise<Result<string>>
  /** The account the saved entry books on, for `onSaved`. */
  accountOf: (input: TInput) => string
  savedText: string
  onSaved?: (accountId: string) => void
}) {
  const toast = useToast()
  const closeSheet = useCloseSheet()
  const [state, submit, pending] = useActionState(
    async (): Promise<State> => {
      const { input, errors } = check()
      if (!input)
        return { errors: errors ?? {}, failed: false, submitted: true }
      const result = await save(input).catch(() => null)
      if (!result?.ok) return { errors: {}, failed: true, submitted: true }
      onSaved?.(accountOf(input))
      toast({ text: savedText, tone: 'success' })
      closeSheet()
      return { errors: {}, failed: false, submitted: true }
    },
    { errors: {}, failed: false, submitted: false },
  )
  const formRef = useFocusFirstError(state.errors)
  return {
    submit,
    pending,
    failed: state.failed,
    errors: state.submitted ? (check().errors ?? {}) : {},
    formRef,
  }
}
