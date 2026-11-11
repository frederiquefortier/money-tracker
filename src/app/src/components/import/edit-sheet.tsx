import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '#/components/forms/form-field'
import { FormSheet } from '#/components/sheet/route-sheet'
import { SheetForm } from '#/components/sheet/sheet-form'
import { Button } from '#/components/ui/button'
import type { Edit } from '#/lib/import/import-edits'

/**
 * IMP-06: a new item changed before it is created. Its name can be another, or empty to
 * create nothing, and some of its text can go to the note of the transactions that carry
 * it.
 */
export function EditSheet({
  name,
  renameOnly = false,
  onEdit,
  onClosed,
}: {
  name: string
  /** A category: it can be renamed, not emptied into a note. */
  renameOnly?: boolean
  onEdit: (edit: Edit) => void
  onClosed: () => void
}) {
  const { t } = useTranslation()
  const [renamed, setRenamed] = useState(name)
  const [note, setNote] = useState('')
  return (
    <FormSheet title={t('common.editName', { name })} onClosed={onClosed}>
      <SheetForm
        action={() => onEdit({ name: renamed.trim(), note: note.trim() })}
        pending={false}
        submitLabel={t('import.edit.confirm')}
      >
        <FormField
          name="name"
          label={t('import.edit.name')}
          value={renamed}
          onChange={(event) => setRenamed(event.target.value)}
        />
        {!renameOnly && (
          <>
            <FormField
              name="note"
              label={t('import.edit.note')}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="self-start"
              onClick={() => {
                setRenamed('')
                setNote(name)
              }}
            >
              {t('import.edit.allToNote')}
            </Button>
          </>
        )}
      </SheetForm>
    </FormSheet>
  )
}
