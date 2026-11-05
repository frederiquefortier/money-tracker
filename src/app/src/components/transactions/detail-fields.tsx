import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox'
import { FieldMessage, FormField } from '#/components/form-field'
import { FieldLabel, fieldControl } from '#/components/ui/field'
import type { FormAccount } from '#/lib/transactions'
import { useFormatLocale } from '#/lib/use-locale'
import { cn } from '#/lib/utils'

/**
 * ACC-03, 04: open accounts not hidden from new transactions, grouped by institution. The
 * account a transaction already has stays choosable.
 */
export function AccountPicker({
  accounts,
  value,
  error,
  onChange,
}: {
  accounts: ReadonlyArray<FormAccount>
  value: string | null
  error: string | undefined
  onChange: (account: FormAccount | null) => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const group = (a: FormAccount) =>
    a.institution ?? t('transactions.noInstitution')
  const options = accounts
    .filter((a) => a.id === value || (!a.closedOn && !a.hiddenForNew))
    .sort(
      (a, b) =>
        group(a).localeCompare(group(b), locale) ||
        a.name.localeCompare(b.name, locale),
    )
    .map((a) => ({
      value: a.id,
      // Names repeat across institutions: the field says which once chosen.
      label: a.institution ? `${a.name} · ${a.institution}` : a.name,
      short: a.name,
      keywords: `${a.institution ?? ''} ${a.currency}`,
      group: group(a),
    }))

  return (
    <Combobox
      label={t('transactions.account')}
      required
      options={options}
      value={value}
      error={error}
      onChange={(id) => onChange(accounts.find((a) => a.id === id) ?? null)}
      clearLabel={t('common.clear')}
    />
  )
}

/** TRX-01: the date, today by default. */
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
    <FormField
      name="occurredOn"
      type="date"
      required
      label={t('transactions.date')}
      value={date}
      error={error}
      onChange={(event) => onChange(event.target.value)}
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
