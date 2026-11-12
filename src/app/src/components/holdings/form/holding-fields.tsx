import { useTranslation } from 'react-i18next'
import { currencyOptions } from '#/components/accounts/form/account-fields'
import { InstitutionPicker } from '#/components/institutions/institution-picker'
import { Combobox } from '#/components/combobox/combobox'
import { DatePickerField } from '#/components/forms/date-picker-field'
import { ChoiceField } from '#/components/forms/choice-field'
import { FormField } from '#/components/forms/form-field'
import { LinkedFields } from '#/components/forms/linked-fields'
import { SelectField } from '#/components/forms/select-field'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { countryOptions } from '#/lib/holdings/countries'
import { HOLDING_KINDS, OTHER_TYPE } from '#/lib/holdings/holding'
import type { Holding, HoldingKind, HoldingType } from '#/lib/holdings/holding'
import { useLocale } from '#/hooks/app/use-locale'
import type { Currency } from '#/lib/currencies/currency'
import type { FieldBinding } from '#/hooks/forms/use-sheet-form'
import type { Institution } from '#/lib/institutions/institution'

export type HoldingValues = {
  country: string
  type: string
  customType: string
  kind: string
  name: string
  openedOn: string
}

type Field = (name: keyof HoldingValues) => FieldBinding

/** The country's types and the generic ones, investments first, then "Autre" (spec 19). */
export function typesFor(
  types: ReadonlyArray<HoldingType>,
  country: string,
  locale: Locale,
) {
  const label = (type: HoldingType) =>
    locale === 'fr' ? type.labelFr : type.labelEn
  return types
    .filter((type) => type.country === country || type.country === null)
    .sort(
      (a, b) =>
        HOLDING_KINDS.indexOf(a.kind) - HOLDING_KINDS.indexOf(b.kind) ||
        label(a).localeCompare(label(b), FORMAT_LOCALE[locale]),
    )
}

/** What a typed type needs: its nature, since it has none of its own, and its name. */
function OtherType({
  field,
  kind,
  onKindChange,
  onTyped,
}: {
  field: Field
  kind: string
  onKindChange: (kind: string) => void
  onTyped: (text: string) => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <ChoiceField
        name="kind"
        required
        label={t('holdings.kind')}
        options={HOLDING_KINDS.map((one) => ({
          value: one,
          label: t(`holdings.kindOne.${one}`),
        }))}
        value={kind as HoldingKind | ''}
        onChange={onKindChange}
        error={field('kind').error}
      />
      <FormField
        {...field('customType')}
        onChange={(event) => {
          onTyped(event.target.value)
          field('customType').onChange(event)
        }}
        autoComplete="off"
        label={t('holdings.customType')}
        required
      />
    </>
  )
}

/** The country, and under it the type that follows from it (a typed one if "Autre"). */
function CountryAndType({
  field,
  onTyped,
  kind,
  onKindChange,
  types,
  country,
  onCountryChange,
  type,
  onTypeChange,
}: {
  field: Field
  onTyped: (text: string) => void
  kind: string
  onKindChange: (kind: string) => void
  types: ReadonlyArray<HoldingType>
  country: string
  onCountryChange: (code: string) => void
  type: string
  onTypeChange: (code: string) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const options = [
    ...typesFor(types, country, locale).map((one) => ({
      value: one.code,
      label: locale === 'fr' ? one.labelFr : one.labelEn,
    })),
    { value: OTHER_TYPE, label: t('holdings.otherType') },
  ]
  return (
    <>
      <Combobox
        label={t('holdings.country')}
        options={countryOptions(locale)}
        value={country || null}
        onChange={(code) => onCountryChange(code ?? '')}
        required
        clearLabel={t('holdings.clearCountry')}
        error={field('country').error}
      />
      <LinkedFields>
        <SelectField
          name="type"
          required
          label={t('holdings.type')}
          value={type}
          onChange={(event) => onTypeChange(event.target.value)}
          options={options}
        />
        {type === OTHER_TYPE && (
          <LinkedFields>
            <OtherType {...{ field, kind, onKindChange, onTyped }} />
          </LinkedFields>
        )}
      </LinkedFields>
    </>
  )
}

/** The holding form's fields. Uncontrolled except the country, type, institution and currency. */
export function HoldingFields({
  field,
  onTyped,
  kind,
  onKindChange,
  types,
  country,
  onCountryChange,
  type,
  onTypeChange,
  currencies,
  institutions,
  institutionId,
  onInstitutionChange,
  currency,
  onCurrencyChange,
  currencyLocked,
  namePlaceholder,
}: {
  field: Field
  /** The text of a typed type, for the name it would give. */
  onTyped: (text: string) => void
  /** The nature of a typed type, '' until chosen. */
  kind: string
  onKindChange: (kind: string) => void
  types: ReadonlyArray<HoldingType>
  country: string
  onCountryChange: (code: string) => void
  type: string
  onTypeChange: (code: string) => void
  currencies: ReadonlyArray<Currency>
  institutions: ReadonlyArray<Institution>
  institutionId: string | null
  onInstitutionChange: (id: string | null) => void
  currency: string
  onCurrencyChange: (code: string) => void
  /** The holding has entries, so its currency cannot change. */
  currencyLocked: boolean
  /** The name it would get with none typed. */
  namePlaceholder: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <>
      <FormField
        {...field('name')}
        placeholder={namePlaceholder}
        autoComplete="off"
        label={t('holdings.name')}
      />
      <CountryAndType
        {...{ field, onTyped, kind, onKindChange, types, country, type }}
        onCountryChange={onCountryChange}
        onTypeChange={onTypeChange}
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
      <DatePickerField
        name="openedOn"
        defaultValue={field('openedOn').defaultValue}
        error={field('openedOn').error}
        required
        label={t('holdings.openedOn')}
      />
    </>
  )
}

/** The values of a form opened on a source's country and type, as a new holding. */
export function startingValues(
  source: Pick<Holding, 'country' | 'type' | 'typeFr' | 'kind'>,
  name: string,
  openedOn: string,
): HoldingValues {
  const typed = source.type === null
  return {
    country: source.country,
    type: source.type ?? OTHER_TYPE,
    customType: typed ? source.typeFr : '',
    kind: typed ? source.kind : '',
    name,
    openedOn,
  }
}
