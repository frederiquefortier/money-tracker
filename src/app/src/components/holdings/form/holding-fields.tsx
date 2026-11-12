import { useTranslation } from 'react-i18next'
import { currencyOptions } from '#/components/accounts/form/account-fields'
import { InstitutionPicker } from '#/components/accounts/institutions/institution-picker'
import { CheckboxField } from '#/components/forms/checkbox-field'
import { DatePickerField } from '#/components/forms/date-picker-field'
import { FormField } from '#/components/forms/form-field'
import { SelectField } from '#/components/forms/select-field'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { HOLDING_KINDS, holdingTypeLabel } from '#/lib/holdings/holding'
import type { HoldingType } from '#/lib/holdings/holding'
import { useLocale } from '#/hooks/app/use-locale'
import type { Currency } from '#/lib/currencies/currency'
import type { FieldBinding } from '#/hooks/forms/use-sheet-form'
import type { Institution } from '#/lib/accounts/account'

export type HoldingValues = {
  name: string
  type: string
  country: string
  openedOn: string
  excludeFromNetWorth: boolean
}

type Field = (name: keyof HoldingValues) => FieldBinding

// Investments first, then assets and debts, each A to Z in the user's language.
function typeOptions(types: ReadonlyArray<HoldingType>, locale: Locale) {
  return [...types]
    .sort(
      (a, b) =>
        HOLDING_KINDS.indexOf(a.kind) - HOLDING_KINDS.indexOf(b.kind) ||
        holdingTypeLabel(a, locale).localeCompare(
          holdingTypeLabel(b, locale),
          FORMAT_LOCALE[locale],
        ),
    )
    .map((type) => ({
      value: type.code,
      label: holdingTypeLabel(type, locale),
    }))
}

/** The holding form's fields. Uncontrolled except the institution and the currency. */
export function HoldingFields({
  values,
  field,
  types,
  currencies,
  institutions,
  institutionId,
  onInstitutionChange,
  currency,
  onCurrencyChange,
  currencyLocked,
}: {
  values: HoldingValues
  field: Field
  types: ReadonlyArray<HoldingType>
  currencies: ReadonlyArray<Currency>
  institutions: ReadonlyArray<Institution>
  institutionId: string | null
  onInstitutionChange: (id: string | null) => void
  currency: string
  onCurrencyChange: (code: string) => void
  /** The holding has entries, so its currency cannot change. */
  currencyLocked: boolean
}) {
  const { t } = useTranslation()
  const locale = useLocale()

  return (
    <>
      <FormField {...field('name')} label={t('holdings.name')} required />
      <SelectField
        name="type"
        required
        label={t('holdings.type')}
        defaultValue={values.type}
        options={typeOptions(types, locale)}
      />
      <InstitutionPicker
        institutions={institutions}
        value={institutionId}
        onChange={onInstitutionChange}
      />
      <SelectField
        name="currency"
        required
        disabled={currencyLocked}
        label={t('holdings.currency')}
        value={currency}
        onChange={(event) => onCurrencyChange(event.target.value)}
        options={currencyOptions(currencies, currency, locale)}
      />
      <FormField
        {...field('country')}
        maxLength={2}
        autoComplete="off"
        className="font-mono uppercase"
        label={t('holdings.country')}
      />
      <DatePickerField
        name="openedOn"
        defaultValue={field('openedOn').defaultValue}
        error={field('openedOn').error}
        required
        label={t('holdings.openedOn')}
      />
      <CheckboxField
        name="excludeFromNetWorth"
        label={t('holdings.excludeFromNetWorth')}
        defaultChecked={values.excludeFromNetWorth}
      />
    </>
  )
}
