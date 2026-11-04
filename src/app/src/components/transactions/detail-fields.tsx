import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox'
import { FieldMessage, FormField } from '#/components/form-field'
import { Button } from '#/components/ui/button'
import { FieldLabel, fieldControl } from '#/components/ui/field'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { todayIso } from '#/lib/format'
import type { FormAccount } from '#/lib/transactions'
import { useLocale } from '#/lib/use-locale'
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
  const locale = FORMAT_LOCALE[useLocale()]
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
      label: a.name,
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

function shiftDays(iso: string, days: number) {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number)
  return todayIso(new Date(year, month - 1, day + days))
}

/** TRX-01: the date, with "Aujourd'hui" and "Hier". */
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
  const today = todayIso()
  const shortcuts = [
    { label: t('transactions.today'), value: today },
    { label: t('transactions.yesterday'), value: shiftDays(today, -1) },
  ]
  return (
    <div className="flex flex-col gap-1">
      <FormField
        name="occurredOn"
        type="date"
        required
        label={t('transactions.date')}
        value={date}
        error={error}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="flex gap-1">
        {shortcuts.map((s) => (
          <Button
            key={s.label}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={date === s.value}
            onClick={() => onChange(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

/** TRX-10: free text, one line that grows as it is typed. */
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
        rows={1}
        maxLength={1000}
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          fieldControl,
          'h-auto min-h-11 field-sizing-content py-2 md:min-h-9',
        )}
      />
      {error && <FieldMessage>{error}</FieldMessage>}
    </div>
  )
}
