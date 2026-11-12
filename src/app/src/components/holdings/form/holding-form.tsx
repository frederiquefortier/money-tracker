import { HoldingFields } from '#/components/holdings/form/holding-fields'
import type { HoldingValues } from '#/components/holdings/form/holding-fields'
import { SheetForm } from '#/components/sheet/sheet-form'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import {
  useHoldingChoices,
  useNamePlaceholder,
} from '#/hooks/holdings/use-holding-choices'
import { holdingFormSchema } from '#/lib/holdings/holding'
import { holdingInputOf } from '#/lib/holdings/holding-input'
import type { HoldingType } from '#/lib/holdings/holding'
import { formValues } from '#/lib/forms/form-state'
import { useMyCurrencies } from '#/hooks/currencies/use-my-currencies'
import { saveHolding } from '#/server/holdings'
import type { Institution } from '#/lib/institutions/institution'

const TEXT_FIELDS = ['customType', 'kind', 'name', 'openedOn'] as const

/** The country, type, institution and currency are chosen live; the rest is read on submit. */
export function HoldingForm({
  holdingId,
  initial,
  initialCurrency,
  initialInstitutionId,
  institutions,
  types,
  currencyLocked,
  savedText,
  onSaved,
}: {
  holdingId?: string
  initial: HoldingValues
  initialCurrency: string
  initialInstitutionId: string | null
  institutions: ReadonlyArray<Institution>
  types: ReadonlyArray<HoldingType>
  currencyLocked: boolean
  savedText: string
  /** Called with the id once saved, for a form that opens over another. */
  onSaved?: (id: string) => void
}) {
  const { currencies } = useMyCurrencies()
  const choice = useHoldingChoices({
    country: initial.country,
    type: initial.type,
    typed: initial.customType,
    kind: initial.kind,
    institutionId: initialInstitutionId,
    currency: initialCurrency,
    types,
  })

  const form = useSheetForm({
    schema: holdingFormSchema,
    initial,
    read: (data) => ({
      ...formValues(data, TEXT_FIELDS),
      country: choice.country,
      type: choice.type,
    }),
    save: async (data) => {
      const result = await saveHolding({
        data: holdingInputOf({
          values: data,
          types,
          id: holdingId,
          currency: choice.currency,
          institutionId: choice.institutionId,
        }),
      })
      if (result.ok) onSaved?.(result.id)
      return result
    },
    savedText,
  })

  const placeholder = useNamePlaceholder(choice, types, institutions)

  return (
    <SheetForm {...form.formProps}>
      <HoldingFields
        field={form.field}
        onTyped={choice.setTyped}
        kind={choice.kind}
        onKindChange={choice.setKind}
        types={types}
        country={choice.country}
        onCountryChange={choice.setCountry}
        type={choice.type}
        onTypeChange={choice.setType}
        currencies={currencies}
        institutions={institutions}
        institutionId={choice.institutionId}
        onInstitutionChange={choice.setInstitutionId}
        currency={choice.currency}
        onCurrencyChange={choice.setCurrency}
        currencyLocked={currencyLocked}
        namePlaceholder={placeholder}
      />
    </SheetForm>
  )
}
