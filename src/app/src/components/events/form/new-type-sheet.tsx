import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { EventTypeForm } from '#/components/events/form/type-form'
import { FormSheet } from '#/components/sheet/route-sheet'
import { useRefresh } from '#/hooks/app/use-refresh'
import { DEFAULT_EVENT_COLOR } from '#/lib/events/event'

/**
 * The type form over the event's, for "Créer « … »" in its Type field. Once closed, the
 * data is refreshed so the new type is there to pick, then `onClosed` gets its id, or null
 * when nothing was saved.
 */
export function NewTypeSheet({
  name,
  onClosed,
}: {
  name: string
  onClosed: (id: string | null) => void
}) {
  const { t } = useTranslation()
  const refresh = useRefresh()
  const saved = useRef<string | null>(null)
  return (
    <FormSheet
      title={t('events.newType')}
      onClosed={() => void refresh().then(() => onClosed(saved.current))}
    >
      <EventTypeForm
        row={null}
        initial={{ name, color: DEFAULT_EVENT_COLOR }}
        savedText={t('events.typeCreated')}
        onSaved={(id) => {
          saved.current = id
        }}
      />
    </FormSheet>
  )
}
