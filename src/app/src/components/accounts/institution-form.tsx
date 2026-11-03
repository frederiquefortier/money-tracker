import { useActionState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '#/components/form-field'
import { useCloseSheet } from '#/components/route-sheet'
import { SheetForm } from '#/components/sheet-form'
import { useToast } from '#/components/toaster'
import { institutionFormSchema } from '#/lib/accounts'
import {
  formValues,
  savedState,
  useFieldValidation,
  useFocusFirstError,
  validate,
} from '#/lib/form'
import type { FormState } from '#/lib/form'
import { saveInstitution } from '#/server/accounts'
import type { Institution } from '#/server/accounts'

type State = FormState<{ name: string; websiteUrl: string }>

function useInstitutionSubmit(institution: Institution | null) {
  const { t } = useTranslation()
  const toast = useToast()
  const closeSheet = useCloseSheet()
  const initial: State = {
    values: {
      name: institution?.name ?? '',
      websiteUrl: institution?.websiteUrl ?? '',
    },
    errors: {},
    failed: false,
  }
  return useActionState(async (_: State, form: FormData): Promise<State> => {
    const values = formValues(form, ['name', 'websiteUrl'])
    const { data, errors } = validate(institutionFormSchema, values)
    if (!data) return { values, errors, failed: false }
    const result = await saveInstitution({
      data: { ...data, id: institution?.id },
    })
    if (result.ok) {
      toast({ text: t('institutions.saved') })
      closeSheet()
    }
    return savedState(values, result)
  }, initial)
}

/** ACC-05, in the same sheet as the account form. */
export function InstitutionForm({
  institution,
}: {
  institution: Institution | null
}) {
  const { t } = useTranslation()
  const [state, submit, pending] = useInstitutionSubmit(institution)
  const fields = useFieldValidation(institutionFormSchema, state.errors)
  const formRef = useFocusFirstError(state.errors)

  return (
    <SheetForm
      action={submit}
      formRef={formRef}
      pending={pending}
      error={state.failed && t('common.saveFailed')}
    >
      <FormField
        name="name"
        label={t('institutions.name')}
        required
        defaultValue={state.values.name}
        error={fields.error('name')}
        onBlur={fields.onBlur}
        onChange={fields.onChange}
      />
      <FormField
        name="websiteUrl"
        type="url"
        inputMode="url"
        placeholder="https://"
        label={t('institutions.website')}
        defaultValue={state.values.websiteUrl}
        error={fields.error('websiteUrl')}
        onBlur={fields.onBlur}
        onChange={fields.onChange}
      />
    </SheetForm>
  )
}
