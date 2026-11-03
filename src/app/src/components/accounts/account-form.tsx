import { useActionState, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountFields } from '#/components/accounts/account-fields'
import type { AccountValues } from '#/components/accounts/account-fields'
import { useCloseSheet } from '#/components/route-sheet'
import { SheetForm } from '#/components/sheet-form'
import { accountFormSchema } from '#/lib/accounts'
import {
  formValues,
  savedState,
  useFieldValidation,
  useFocusFirstError,
  validate,
} from '#/lib/form'
import type { FormState } from '#/lib/form'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { saveAccount } from '#/server/accounts'
import type { AccountType, Institution } from '#/server/accounts'

type State = FormState<AccountValues>

function useAccountSubmit({
  accountId,
  initial,
  institutionId,
  onSaved,
}: {
  accountId: string | undefined
  initial: AccountValues
  institutionId: string | null
  onSaved: () => void
}) {
  return useActionState(
    async (_: State, form: FormData): Promise<State> => {
      const values = {
        ...formValues(form, [
          'name',
          'type',
          'currency',
          'openingBalance',
          'openedOn',
        ]),
        hiddenForNew: form.get('hiddenForNew') === 'on',
      }
      const { data, errors } = validate(accountFormSchema, values)
      if (!data) return { values, errors, failed: false }
      const result = await saveAccount({
        data: {
          ...data,
          id: accountId,
          institutionId,
          hiddenForNew: values.hiddenForNew,
        },
      })
      if (result.ok) onSaved()
      return savedState(values, result)
    },
    { values: initial, errors: {}, failed: false },
  )
}

/**
 * SET-07: errors under each field on blur and on submit, focus on the first one, typed
 * values kept on failure.
 */
export function AccountForm({
  accountId,
  initial,
  initialInstitutionId,
  institutions,
  types,
  onSaved,
}: {
  accountId?: string
  initial: AccountValues
  initialInstitutionId: string | null
  institutions: ReadonlyArray<Institution>
  types: ReadonlyArray<AccountType>
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const { currencies } = useMyCurrencies()
  const [institutionId, setInstitutionId] = useState(initialInstitutionId)
  const [currency, setCurrency] = useState(initial.currency)
  const [created, setCreated] = useState<Array<Institution>>([])
  const closeSheet = useCloseSheet()
  const [state, submit, pending] = useAccountSubmit({
    accountId,
    initial,
    institutionId,
    onSaved: () => {
      onSaved()
      closeSheet()
    },
  })
  const fields = useFieldValidation(accountFormSchema, state.errors)
  const formRef = useFocusFirstError(state.errors)

  return (
    <SheetForm
      action={submit}
      formRef={formRef}
      pending={pending}
      error={state.failed && t('common.saveFailed')}
    >
      <AccountFields
        values={state.values}
        fields={fields}
        types={types}
        currencies={currencies}
        institutions={[...institutions, ...created]}
        institutionId={institutionId}
        onInstitutionChange={(id, made) => {
          setInstitutionId(id)
          if (made) setCreated((list) => [...list, made])
        }}
        currency={currency}
        onCurrencyChange={setCurrency}
      />
    </SheetForm>
  )
}
