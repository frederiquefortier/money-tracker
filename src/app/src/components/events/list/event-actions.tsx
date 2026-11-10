import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { deleteEvent, deleteEventType } from '#/server/events'

export type EventKind = 'event' | 'type'

/** Delete on an event's or a type's row or sheet (EVT-01, 02); events are never archived. */
export function EventActions({
  kind,
  row,
  placement,
}: {
  kind: EventKind
  row: { id: string; name: string; count: number }
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const [deleting, setDeleting] = useState(false)
  const label = t('common.deleteName', { name: row.name })
  const close = () => setDeleting(false)
  const note =
    kind === 'event' ? 'events.deleteDetaches' : 'events.deleteTypeKeeps'

  return (
    <IconActions slots={1} placement={placement}>
      <IconButton
        icon="trash-full"
        label={label}
        onClick={() => setDeleting(true)}
      />
      <DeleteDialog
        open={deleting}
        title={label}
        description={row.count > 0 ? t(note, { count: row.count }) : undefined}
        onDelete={() =>
          kind === 'event'
            ? deleteEvent({ data: { id: row.id } })
            : deleteEventType({ data: { id: row.id } })
        }
        onClose={close}
      />
    </IconActions>
  )
}
