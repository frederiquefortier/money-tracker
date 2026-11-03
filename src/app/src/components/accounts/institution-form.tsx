import { useActionState, useState, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { FormAlert, FormField } from '#/components/form-field'
import { useCloseSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'
import { Button } from '#/components/ui/button'
import { SheetBody, SheetClose, SheetFooter } from '#/components/ui/sheet'
import { institutionFormSchema } from '#/lib/accounts'
import {
  formValues,
  useFieldValidation,
  useFocusFirstError,
  validate,
} from '#/lib/form'
import type { FieldErrors } from '#/lib/form'
import { deleteInstitution, saveInstitution } from '#/server/accounts'
import type { Institution } from '#/server/accounts'

type Values = { name: string; websiteUrl: string }
type State = { values: Values; errors: FieldErrors; failed: boolean }

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
      return { values, errors: {}, failed: false }
    }
    return result.error === 'nameTaken'
      ? { values, errors: { name: 'nameTaken' }, failed: false }
      : { values, errors: {}, failed: true }
  }, initial)
}

/** Delete, disabled while any account, open or closed, uses the institution (ACC-05). */
function DeleteInstitution({
  institution,
  inUse,
}: {
  institution: Institution
  inUse: boolean
}) {
  const { t } = useTranslation()
  const closeSheet = useCloseSheet()
  const [busy, start] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [failed, setFailed] = useState(false)

  function remove() {
    start(async () => {
      const result = await deleteInstitution({ data: { id: institution.id } })
      setConfirming(false)
      if (result.ok) closeSheet()
      else setFailed(true)
    })
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-5">
      <Button
        type="button"
        variant="outline"
        className="self-start text-destructive hover:text-destructive"
        disabled={inUse || busy}
        onClick={() => setConfirming(true)}
      >
        {t('institutions.delete')}
      </Button>
      {failed && <FormAlert>{t('common.saveFailed')}</FormAlert>}
      <ConfirmDialog
        open={confirming}
        title={t('institutions.deleteConfirm', { name: institution.name })}
        confirmLabel={t('institutions.delete')}
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
      />
    </div>
  )
}

/** ACC-05, in the same sheet as the account form. */
export function InstitutionForm({
  institution,
  inUse = false,
}: {
  institution: Institution | null
  inUse?: boolean
}) {
  const { t } = useTranslation()
  const [state, submit, pending] = useInstitutionSubmit(institution)
  const fields = useFieldValidation(institutionFormSchema, state.errors)
  const formRef = useFocusFirstError(state.errors)

  return (
    <form
      ref={formRef}
      action={submit}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <SheetBody className="flex flex-col gap-5">
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
        {state.failed && <FormAlert>{t('common.saveFailed')}</FormAlert>}
        {institution && (
          <DeleteInstitution institution={institution} inUse={inUse} />
        )}
      </SheetBody>
      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="ghost">
            {t('accounts.cancel')}
          </Button>
        </SheetClose>
        <Button type="submit" disabled={pending}>
          {pending ? t('accounts.saving') : t('accounts.save')}
        </Button>
      </SheetFooter>
    </form>
  )
}
