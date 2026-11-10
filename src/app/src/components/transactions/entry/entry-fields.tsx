import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { DatePickerField } from '#/components/forms/date-picker-field'
import { FieldMessage } from '#/components/forms/form-field'
import { FieldLabel, fieldControl } from '#/components/ui/field'
import { accountLabel } from '#/lib/accounts/account'
import { compareNames } from '#/lib/shared/collections'
import type { FormAccount } from '#/lib/transactions/transaction'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'

/**
 * ACC-03, 04: open accounts not hidden from new transactions, grouped by institution. The
 * account a transaction already has stays choosable. A transfer's Vers leaves out its De.
 */
export function AccountPicker({
  accounts,
  value,
  label,
  exclude = null,
  error,
  onChange,
}: {
  accounts: ReadonlyArray<FormAccount>
  value: string | null
  label?: string
  exclude?: string | null
  error: string | undefined
  onChange: (account: FormAccount | null) => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const byName = compareNames(locale)
  const group = (a: FormAccount) =>
    a.institution ?? t('transactions.noInstitution')
  const options = accounts
    .filter(
      (a) =>
        a.id === value || (!a.closedOn && !a.hiddenForNew && a.id !== exclude),
    )
    .sort((a, b) => group(a).localeCompare(group(b), locale) || byName(a, b))
    .map((a) => ({
      value: a.id,
      // Names repeat across institutions: the field says which once chosen.
      label: accountLabel(a),
      short: a.name,
      keywords: `${a.institution ?? ''} ${a.currency}`,
      group: group(a),
    }))

  return (
    <Combobox
      label={label ?? t('transactions.account')}
      required
      options={options}
      value={value}
      error={error}
      onChange={(id) => onChange(accounts.find((a) => a.id === id) ?? null)}
      clearLabel={t('common.clear')}
    />
  )
}

/** TRX-01: the date, today by default (the shared calendar, ADR-027). */
export function DateField({
  date,
  error,
  onChange,
}: {
  date: string
  error: string | undefined
  onChange: (date: string) => void
}) {
  const { t } = useTranslation()
  return (
    <DatePickerField
      name="occurredOn"
      required
      label={t('transactions.date')}
      value={date}
      error={error}
      onChange={onChange}
    />
  )
}

/** TRX-10: free text, three lines high, growing as it is typed. */
export function NoteField({
  value,
  error,
  onChange,
}: {
  value: string
  error?: string
  onChange: (note: string) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={id}>{t('transactions.note')}</FieldLabel>
      <textarea
        id={id}
        rows={3}
        maxLength={1000}
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          fieldControl,
          'h-auto min-h-24 field-sizing-content py-2 md:h-auto',
        )}
      />
      {error && <FieldMessage>{error}</FieldMessage>}
    </div>
  )
}
