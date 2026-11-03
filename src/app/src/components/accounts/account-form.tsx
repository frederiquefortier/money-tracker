import { useActionState, useState } from 'react'
import { useRouteContext } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { AccountFields } from '#/components/accounts/account-fields'
import type { AccountValues } from '#/components/accounts/account-fields'
import { FormAlert } from '#/components/form-field'
import { useCloseSheet } from '#/components/route-sheet'
import { Button } from '#/components/ui/button'
import { SheetBody, SheetClose, SheetFooter } from '#/components/ui/sheet'
import { accountFormSchema } from '#/lib/accounts'
import {
  formValues,
  useFieldValidation,
  useFocusFirstError,
  validate,
} from '#/lib/form'
import type { FieldErrors } from '#/lib/form'
import { saveAccount } from '#/server/accounts'
import type { AccountType, Institution } from '#/server/accounts'

type State = { values: AccountValues; errors: FieldErrors; failed: boolean }

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
  const [state, submit, pending] = useActionState(
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
      if (result.ok) {
        onSaved()
        return { values, errors: {}, failed: false }
      }
      return result.error === 'nameTaken'
        ? { values, errors: { name: 'nameTaken' }, failed: false }
        : { values, errors: {}, failed: true }
    },
    { values: initial, errors: {}, failed: false },
  )
  return { state, submit, pending }
}

/**
 * SET-07: errors under each field on blur and on submit, focus on the first one, typed
 * values kept on failure. The form spans the sheet's body and footer.
 */
export function AccountForm({
  accountId,
  initial,
  initialInstitutionId,
  institutions,
  types,
  onSaved,
  children,
}: {
  accountId?: string
  initial: AccountValues
  initialInstitutionId: string | null
  institutions: ReadonlyArray<Institution>
  types: ReadonlyArray<AccountType>
  onSaved: () => void
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  const { session } = useRouteContext({ from: '__root__' })
  const currencies = useMyCurrencies()
  const [institutionId, setInstitutionId] = useState(initialInstitutionId)
  const [currency, setCurrency] = useState(initial.currency)
  const [created, setCreated] = useState<Array<Institution>>([])
  const closeSheet = useCloseSheet()
  const { state, submit, pending } = useAccountSubmit({
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
    <form
      ref={formRef}
      action={submit}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <SheetBody className="flex flex-col gap-5">
        <AccountFields
          values={state.values}
          fields={fields}
          types={types}
          currencies={currencies.currencies}
          institutions={[...institutions, ...created]}
          institutionId={institutionId}
          onInstitutionChange={(id, made) => {
            setInstitutionId(id)
            if (made) setCreated((list) => [...list, made])
          }}
          currency={currency}
          onCurrencyChange={setCurrency}
          locale={session.locale}
        />
        {state.failed && <FormAlert>{t('common.saveFailed')}</FormAlert>}
        {children}
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
