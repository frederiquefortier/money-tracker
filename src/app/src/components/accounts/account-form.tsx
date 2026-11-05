import { useState } from 'react'
import { AccountFields } from '#/components/accounts/account-fields'
import type { AccountValues } from '#/components/accounts/account-fields'
import { SheetForm } from '#/components/sheet-form'
import { useSheetForm } from '#/components/use-sheet-form'
import { accountFormSchema } from '#/lib/accounts'
import { formValues } from '#/lib/form'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { saveAccount } from '#/server/accounts'
import type { AccountType, Institution } from '#/server/accounts'

const TEXT_FIELDS = [
  'name',
  'type',
  'currency',
  'openingBalance',
  'openedOn',
] as const

/** Spec 11. The institution and the currency are chosen live; the rest is read on submit. */
export function AccountForm({
  accountId,
  initial,
  initialInstitutionId,
  institutions,
  types,
  savedText,
}: {
  accountId?: string
  initial: AccountValues
  initialInstitutionId: string | null
  institutions: ReadonlyArray<Institution>
  types: ReadonlyArray<AccountType>
  savedText: string
}) {
  const { currencies } = useMyCurrencies()
  const [institutionId, setInstitutionId] = useState(initialInstitutionId)
  const [currency, setCurrency] = useState(initial.currency)
  const form = useSheetForm({
    schema: accountFormSchema,
    initial,
    read: (data) => ({
      ...formValues(data, TEXT_FIELDS),
      hiddenForNew: data.get('hiddenForNew') === 'on',
    }),
    save: (data, values) =>
      saveAccount({
        data: {
          ...data,
          id: accountId,
          institutionId,
          hiddenForNew: values.hiddenForNew,
        },
      }),
    savedText,
  })

  return (
    <SheetForm {...form.formProps}>
      <AccountFields
        values={form.values}
        field={form.field}
        types={types}
        currencies={currencies}
        institutions={institutions}
        institutionId={institutionId}
        onInstitutionChange={setInstitutionId}
        currency={currency}
        onCurrencyChange={setCurrency}
      />
    </SheetForm>
  )
}
