import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DatePickerField } from '#/components/forms/date-picker-field'
import { FormField } from '#/components/forms/form-field'
import { SheetForm } from '#/components/sheet/sheet-form'
import { FormSheet } from '#/components/sheet/route-sheet'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import type { FieldBinding } from '#/hooks/forms/use-sheet-form'
import {
  contributionFormSchema,
  snapshotFormSchema,
} from '#/lib/holdings/holding'
import { saveContribution, saveSnapshot } from '#/server/holding-entries'
import { amountForInput } from '#/lib/shared/money'
import { useLocale } from '#/hooks/app/use-locale'
import type { EntryKind } from '#/components/holdings/form/entry-lists'

export type EntryValues = {
  onDate: string
  amount: string
  label: string
}

function EntryFields({
  field,
  withLabel,
}: {
  field: (name: keyof EntryValues) => FieldBinding
  withLabel: boolean
}) {
  const { t } = useTranslation()
  return (
    <>
      <DatePickerField
        name="onDate"
        defaultValue={field('onDate').defaultValue}
        error={field('onDate').error}
        required
        label={t('holdings.date')}
      />
      <FormField
        {...field('amount')}
        inputMode="decimal"
        autoComplete="off"
        className="font-mono"
        label={t('holdings.amount')}
        required
      />
      {withLabel && (
        <FormField {...field('label')} label={t('holdings.label')} />
      )}
    </>
  )
}

function ValueForm({
  holdingId,
  id,
  initial,
}: {
  holdingId: string
  id: string | null
  initial: EntryValues
}) {
  const { t } = useTranslation()
  const form = useSheetForm({
    schema: snapshotFormSchema,
    initial,
    save: (data) =>
      saveSnapshot({ data: { ...data, id: id ?? undefined, holdingId } }),
    savedText: t('holdings.valueSaved'),
  })
  return (
    <SheetForm {...form.formProps}>
      <EntryFields field={form.field} withLabel={false} />
    </SheetForm>
  )
}

function ContributionForm({
  holdingId,
  id,
  initial,
}: {
  holdingId: string
  id: string | null
  initial: EntryValues
}) {
  const { t } = useTranslation()
  const form = useSheetForm({
    schema: contributionFormSchema,
    initial,
    save: (data) =>
      saveContribution({ data: { ...data, id: id ?? undefined, holdingId } }),
    savedText: t('holdings.contributionSaved'),
  })
  return (
    <SheetForm {...form.formProps}>
      <EntryFields field={form.field} withLabel />
    </SheetForm>
  )
}

/**
 * A value or an employer contribution, in a sheet over the holding's. Once closed the
 * data is refreshed, the holding's sheet route included, so its lists show the change.
 */
export function EntrySheet({
  kind,
  entry,
  holdingId,
  currency,
  today,
  onClosed,
}: {
  kind: EntryKind
  /** The row being edited; null for a new one. */
  entry: {
    id: string
    onDate: string
    amount: string
    label?: string | null
  } | null
  holdingId: string
  currency: string
  today: string
  onClosed: () => void
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const locale = useLocale()
  const initial: EntryValues = {
    onDate: entry?.onDate ?? today,
    amount: entry ? amountForInput(entry.amount, currency, locale) : '',
    label: entry?.label ?? '',
  }
  const title =
    kind === 'snapshot'
      ? t(entry ? 'holdings.editValue' : 'holdings.newValue')
      : t(entry ? 'holdings.editContribution' : 'holdings.newContribution')
  const Form = kind === 'snapshot' ? ValueForm : ContributionForm

  return (
    <FormSheet
      title={title}
      onClosed={() => void router.invalidate().then(onClosed)}
    >
      <Form holdingId={holdingId} id={entry?.id ?? null} initial={initial} />
    </FormSheet>
  )
}
