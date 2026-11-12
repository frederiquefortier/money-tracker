import { useState } from 'react'
import { HoldingFields } from '#/components/holdings/form/holding-fields'
import type { HoldingValues } from '#/components/holdings/form/holding-fields'
import { SheetForm } from '#/components/sheet/sheet-form'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import { holdingFormSchema } from '#/lib/holdings/holding'
import { formValues } from '#/lib/forms/form-state'
import { useMyCurrencies } from '#/hooks/currencies/use-my-currencies'
import { saveHolding } from '#/server/holdings'
import type { HoldingType } from '#/lib/holdings/holding'
import type { Institution } from '#/lib/accounts/account'

const TEXT_FIELDS = ['name', 'type', 'country', 'openedOn'] as const

/** The institution and the currency are chosen live; the rest is read on submit. */
export function HoldingForm({
  holdingId,
  initial,
  initialCurrency,
  initialInstitutionId,
  institutions,
  types,
  currencyLocked,
  savedText,
  children,
}: {
  holdingId?: string
  initial: HoldingValues
  initialCurrency: string
  initialInstitutionId: string | null
  institutions: ReadonlyArray<Institution>
  types: ReadonlyArray<HoldingType>
  currencyLocked: boolean
  savedText: string
  /** The lists below the fields, on a saved holding. */
  children?: React.ReactNode
}) {
  const { currencies } = useMyCurrencies()
  const [institutionId, setInstitutionId] = useState(initialInstitutionId)
  const [currency, setCurrency] = useState(initialCurrency)
  const form = useSheetForm({
    schema: holdingFormSchema.omit({ currency: true }),
    initial,
    read: (data) => ({
      ...formValues(data, TEXT_FIELDS),
      excludeFromNetWorth: data.get('excludeFromNetWorth') === 'on',
    }),
    save: (data, values) =>
      saveHolding({
        data: {
          ...data,
          id: holdingId,
          currency,
          institutionId,
          excludeFromNetWorth: values.excludeFromNetWorth,
        },
      }),
    savedText,
  })

  return (
    <SheetForm {...form.formProps}>
      <HoldingFields
        values={form.values}
        field={form.field}
        types={types}
        currencies={currencies}
        institutions={institutions}
        institutionId={institutionId}
        onInstitutionChange={setInstitutionId}
        currency={currency}
        onCurrencyChange={setCurrency}
        currencyLocked={currencyLocked}
      />
      {children}
    </SheetForm>
  )
}
