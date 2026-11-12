import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { EntryFields } from '#/components/holdings/form/entry-sheet'
import { HoldingForm } from '#/components/holdings/form/holding-form'
import { startingValues } from '#/components/holdings/form/holding-fields'
import { FormSheet } from '#/components/sheet/route-sheet'
import { SheetForm } from '#/components/sheet/sheet-form'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import { transferFormSchema, transferTargets } from '#/lib/holdings/holding'
import { todayIso } from '#/lib/shared/format'
import { saveHoldingTransfer } from '#/server/holding-entries'
import { formValues } from '#/lib/forms/form-state'
import type { Holding, HoldingType } from '#/lib/holdings/holding'
import type { Institution } from '#/lib/institutions/institution'

const TEXT_FIELDS = ['onDate', 'amount'] as const

export type ListedHolding = Holding & { label: string }

/**
 * NW-03: money moved from a holding to another of the same currency on a date, as when
 * an account closes at one institution and its money goes to another. The target is
 * chosen, or created in a sheet over this one. A transfer is dated, so history stays put.
 */
export function TransferFormSheet({
  source,
  holdings,
  institutions,
  types,
  onClosed,
}: {
  source: ListedHolding
  holdings: ReadonlyArray<ListedHolding>
  institutions: ReadonlyArray<Institution>
  types: ReadonlyArray<HoldingType>
  onClosed: () => void
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [target, setTarget] = useState<string | null>(null)
  // The name typed in "Créer « … »", while the new holding's sheet is open.
  const [creating, setCreating] = useState<string | undefined>()
  const form = useSheetForm({
    schema: transferFormSchema,
    initial: { onDate: todayIso(), amount: '', to: '' },
    read: (data) => ({
      ...formValues(data, TEXT_FIELDS),
      to: target ?? '',
    }),
    save: (data) => saveHoldingTransfer({ data: { ...data, from: source.id } }),
    savedText: t('holdings.transferred'),
  })
  const options = transferTargets(holdings, source).map((h) => ({
    value: h.id,
    label: h.label,
  }))

  return (
    <>
      <FormSheet
        title={t('holdings.newTransfer')}
        onClosed={() => void router.invalidate().then(onClosed)}
      >
        <SheetForm {...form.formProps} submitLabel={t('holdings.transfer')}>
          <EntryFields field={form.field} />
          <Combobox
            label={t('holdings.transferTo')}
            options={options}
            value={target}
            onChange={setTarget}
            required
            clearLabel={t('holdings.clearField')}
            createLabel={(text) => t('common.createText', { text })}
            onCreate={setCreating}
            error={form.field('to').error}
          />
        </SheetForm>
      </FormSheet>
      {creating !== undefined && (
        <FormSheet
          title={t('holdings.newTitle')}
          onClosed={() =>
            void router.invalidate().then(() => setCreating(undefined))
          }
        >
          <HoldingForm
            initial={startingValues(source, creating, todayIso())}
            initialCurrency={source.currency}
            initialInstitutionId={null}
            institutions={institutions}
            types={types}
            currencyLocked
            savedText={t('holdings.created')}
            onSaved={setTarget}
          />
        </FormSheet>
      )}
    </>
  )
}
