import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorGrid } from '#/components/categories/form/appearance-fields'
import { FormField } from '#/components/forms/form-field'
import { SheetForm } from '#/components/sheet/sheet-form'
import { EVENT_SWATCHES } from '#/lib/events/event'
import type { EventType } from '#/lib/events/event'
import { useMarkChanged } from '#/hooks/forms/use-sheet'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import { nameFormSchema } from '#/lib/shared/validation'
import { saveEventType } from '#/server/events'

const NO_USED: ReadonlySet<string> = new Set()

/**
 * EVT-01 (spec 22): a type is a colour, then a name. `onSaved` gets the new id, for the
 * event form that opened it over itself.
 */
export function EventTypeForm({
  row,
  initial,
  savedText,
  onSaved,
}: {
  row: EventType | null
  initial: { name: string; color: string }
  savedText: string
  onSaved?: (id: string) => void
}) {
  const { t } = useTranslation()
  const markChanged = useMarkChanged()
  const [color, setColor] = useState(initial.color)
  const form = useSheetForm({
    schema: nameFormSchema,
    initial: { name: initial.name },
    save: async (data) => {
      const result = await saveEventType({
        data: { ...data, id: row?.id, color },
      })
      if (result.ok) onSaved?.(result.id)
      return result
    },
    savedText,
  })

  return (
    <SheetForm {...form.formProps}>
      {/* A row, so the grid's flex-1 takes the width and not the sheet's height. */}
      <div className="flex">
        <ColorGrid
          used={NO_USED}
          swatches={EVENT_SWATCHES}
          draft={{
            color,
            canResetColor: false,
            pickColor: (next) => {
              markChanged()
              setColor(next)
            },
            resetColor: () => {},
          }}
        />
      </div>
      <FormField {...form.field('name')} label={t('events.name')} required />
    </SheetForm>
  )
}
