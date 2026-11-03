import { useTranslation } from 'react-i18next'
import { InstitutionPicker } from '#/components/accounts/institution-picker'
import { CheckboxField } from '#/components/checkbox-field'
import { FormField } from '#/components/form-field'
import { SelectField } from '#/components/select-field'
import { LinkedFields } from '#/components/linked-fields'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { typeLabel } from '#/lib/accounts'
import { currencyName, pickerOrder } from '#/lib/currencies'
import { useLocale } from '#/lib/use-locale'
import type { UserCurrency } from '#/lib/currencies'
import type { AccountType, Institution } from '#/server/accounts'

export type AccountValues = {
  name: string
  type: string
  currency: string
  openingBalance: string
  openedOn: string
  hiddenForNew: boolean
}

type FieldProps = {
  error: (name: string) => string | undefined
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

// A currency the user removed still shows on an account that uses it.
function currencyOptions(
  currencies: ReadonlyArray<UserCurrency>,
  current: string,
  locale: Locale,
) {
  const options = pickerOrder(currencies).map((c) => ({
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

/** The opening date and the balance on that date, linked. */
function OpeningFields({
  values,
  fields,
}: {
  values: AccountValues
  fields: FieldProps
}) {
  const { t } = useTranslation()
  const events = { onBlur: fields.onBlur, onChange: fields.onChange }
  return (
    <LinkedFields>
      <FormField
        name="openedOn"
        type="date"
        required
        label={t('accounts.openedOn')}
        defaultValue={values.openedOn}
        error={fields.error('openedOn')}
        {...events}
      />
      <FormField
        name="openingBalance"
        inputMode="decimal"
        autoComplete="off"
        label={t('accounts.openingBalance')}
        defaultValue={values.openingBalance}
        error={fields.error('openingBalance')}
        {...events}
      />
    </LinkedFields>
  )
}

/** The account form's fields (spec 11). Uncontrolled except the institution and currency. */
export function AccountFields({
  values,
  fields,
  types,
  currencies,
  institutions,
  institutionId,
  onInstitutionChange,
  currency,
  onCurrencyChange,
}: {
  values: AccountValues
  fields: FieldProps
  types: ReadonlyArray<AccountType>
  currencies: ReadonlyArray<UserCurrency>
  institutions: ReadonlyArray<Institution>
  institutionId: string | null
  onInstitutionChange: (id: string | null, created?: Institution) => void
  currency: string
  onCurrencyChange: (code: string) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()

  return (
    <>
      <FormField
        name="name"
        label={t('accounts.name')}
        required
        defaultValue={values.name}
        error={fields.error('name')}
        onBlur={fields.onBlur}
        onChange={fields.onChange}
      />
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
      <OpeningFields values={values} fields={fields} />
      <CheckboxField
        name="hiddenForNew"
        label={t('accounts.hideFromNew')}
        defaultChecked={values.hiddenForNew}
      />
    </>
  )
}
