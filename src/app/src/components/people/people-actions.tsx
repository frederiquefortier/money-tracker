import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { FormField } from '#/components/form-field'
import { IconActions, IconButton } from '#/components/icon-button'
import type { ActionPlacement } from '#/components/icon-button'
import { useServerAction } from '#/components/use-server-action'
import { todayIso } from '#/lib/format'
import { archivePeopleRow, deletePeopleRow } from '#/server/people'

export type PeopleKind = 'person' | 'group'

/** Archive or reactivate (PPL-02) and delete, on a person's or a group's row or sheet. */
export function PeopleActions({
  kind,
  row,
  placement,
}: {
  kind: PeopleKind
  row: { id: string; name: string; archivedOn: string | null }
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const { run, busy } = useServerAction()
  const [dialog, setDialog] = useState<'archive' | 'delete' | null>(null)
  const [archivedOn, setArchivedOn] = useState('')
  const { id, name } = row
  const close = () => setDialog(null)

  return (
    <IconActions slots={2} placement={placement}>
      {row.archivedOn ? (
        <IconButton
          icon="undo"
          label={t('common.reactivateName', { name })}
          onClick={() =>
            run(() =>
              archivePeopleRow({ data: { kind, id, archivedOn: null } }),
            )
          }
        />
      ) : (
        <IconButton
          icon="archive"
          label={t('common.archiveName', { name })}
          onClick={() => {
            setArchivedOn(todayIso())
            setDialog('archive')
          }}
        />
      )}
      <IconButton
        icon="trash-full"
        label={t('common.deleteName', { name })}
        onClick={() => setDialog('delete')}
      />
      <ConfirmDialog
        open={dialog === 'archive'}
        tone="default"
        title={t('common.archiveName', { name })}
        confirmLabel={t('common.archive')}
        busy={busy}
        canConfirm={archivedOn !== ''}
        onCancel={close}
        onConfirm={() =>
          run(() => archivePeopleRow({ data: { kind, id, archivedOn } }), {
            onResult: close,
          })
        }
      >
        <FormField
          name="archivedOn"
          type="date"
          required
          label={t('people.archivedOnField')}
          value={archivedOn}
          onChange={(event) => setArchivedOn(event.target.value)}
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'delete'}
        title={t('common.deleteName', { name })}
        confirmLabel={t('common.delete')}
        busy={busy}
        onCancel={close}
        onConfirm={() =>
          run(() => deletePeopleRow({ data: { kind, id } }), {
            onResult: close,
          })
        }
      />
    </IconActions>
  )
}
