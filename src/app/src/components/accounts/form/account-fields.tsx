import { useTranslation } from 'react-i18next'
import { InstitutionPicker } from '#/components/accounts/institutions/institution-picker'
import { CheckboxField } from '#/components/forms/checkbox-field'
import { DatePickerField } from '#/components/forms/date-picker-field'
import { FormField } from '#/components/forms/form-field'
import { SelectField } from '#/components/forms/select-field'
import { LinkedFields } from '#/components/forms/linked-fields'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { typeLabel } from '#/lib/accounts/account'
import { currencyName } from '#/lib/currencies/currency'
import { useLocale } from '#/hooks/app/use-locale'
import type { Currency } from '#/lib/currencies/currency'
import type { FieldBinding } from '#/hooks/forms/use-sheet-form'
import type { AccountType, Institution } from '#/lib/accounts/account'

export type AccountValues = {
  name: string
  type: string
  currency: string
  openingBalance: string
  openedOn: string
  hiddenForNew: boolean
}

type Field = (name: keyof AccountValues) => FieldBinding

// A currency the user removed still shows on an account that uses it.
function currencyOptions(
  currencies: ReadonlyArray<Currency>,
  current: string,
  locale: Locale,
) {
  const options = currencies.map((c) => ({
    value: c.code,
    label: `${c.code} - ${currencyName(c, locale)}`,
  }))
  if (!options.some((o) => o.value === current)) {
    options.push({ value: current, label: current })
  }
  return options
}

function typeOptions(types: ReadonlyArray<AccountType>, locale: Locale) {
  return types
    .map((type) => ({ value: type.code, label: typeLabel(type, locale) }))
    .sort((a, b) => a.label.localeCompare(b.label, FORMAT_LOCALE[locale]))
}

/** The opening date, with the balance on that date as its sub-field. */
function OpeningFields({ field }: { field: Field }) {
  const { t } = useTranslation()
  return (
    <>
      <DatePickerField
        name="openedOn"
        defaultValue={field('openedOn').defaultValue}
        error={field('openedOn').error}
        required
        label={t('accounts.openedOn')}
      />
      <LinkedFields>
        <FormField
          {...field('openingBalance')}
          inputMode="decimal"
          autoComplete="off"
          label={t('accounts.openingBalance')}
        />
      </LinkedFields>
    </>
  )
}

/** The account form's fields (spec 11). Uncontrolled except the institution and currency. */
export function AccountFields({
  values,
  field,
  types,
  currencies,
  institutions,
  institutionId,
  onInstitutionChange,
  currency,
  onCurrencyChange,
}: {
  values: AccountValues
  field: Field
  types: ReadonlyArray<AccountType>
  currencies: ReadonlyArray<Currency>
  institutions: ReadonlyArray<Institution>
  institutionId: string | null
  onInstitutionChange: (id: string | null) => void
  currency: string
  onCurrencyChange: (code: string) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()

  return (
    <>
      <FormField {...field('name')} label={t('accounts.name')} required />
      <SelectField
        name="type"
        required
        label={t('accounts.type')}
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
        label={t('accounts.currency')}
        value={currency}
        onChange={(event) => onCurrencyChange(event.target.value)}
        options={currencyOptions(currencies, currency, locale)}
      />
      <OpeningFields field={field} />
      <CheckboxField
        name="hiddenForNew"
        label={t('accounts.hideFromNew')}
        defaultChecked={values.hiddenForNew}
      />
    </>
  )
}
