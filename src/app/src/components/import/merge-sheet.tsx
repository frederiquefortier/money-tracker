import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { FormField } from '#/components/forms/form-field'
import { FormSheet } from '#/components/sheet/route-sheet'
import { SheetForm } from '#/components/sheet/sheet-form'

/**
 * IMP-06: what a new item is merged into, chosen among the names that exist and the other
 * new ones. The choice only renames it in this import.
 */
export function MergeSheet({
  name,
  options,
  withNote = false,
  onMerge,
  onClosed,
}: {
  name: string
  options: ReadonlyArray<string>
  /** Merchants, people and events can also send some text to the note. */
  withNote?: boolean
  onMerge: (target: string, note: string) => void
  onClosed: () => void
}) {
  const { t } = useTranslation()
  const [target, setTarget] = useState<string | null>(null)
  const [note, setNote] = useState('')
  return (
    <FormSheet title={t('import.merge', { name })} onClosed={onClosed}>
      <SheetForm
        action={() => target !== null && onMerge(target, note.trim())}
        pending={false}
        canSubmit={target !== null}
        submitLabel={t('import.mergeConfirm')}
      >
        <Combobox
          label={t('import.mergeInto')}
          options={options.map((option) => ({ value: option, label: option }))}
          value={target}
          onChange={setTarget}
          clearLabel={t('import.mergeClear')}
        />
        {withNote && (
          <FormField
            name="note"
            label={t('import.edit.note')}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        )}
      </SheetForm>
    </FormSheet>
  )
}
