import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { FormField } from '#/components/forms/form-field'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { useServerAction } from '#/hooks/app/use-server-action'
import { todayIso } from '#/lib/shared/format'
import { archivePeopleRow, deletePeopleRow } from '#/server/people'

export type PeopleKind = 'person' | 'group'

/** PPL-02: the shared archive dialog, its date today unless changed. */
function ArchiveDialog({
  kind,
  id,
  name,
  onClose,
}: {
  kind: PeopleKind
  id: string
  name: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { run, busy } = useServerAction()
  const [archivedOn, setArchivedOn] = useState(todayIso)
  return (
    <ConfirmDialog
      open
      tone="default"
      title={t('common.archiveName', { name })}
      confirmLabel={t('common.archive')}
      busy={busy}
      canConfirm={archivedOn !== ''}
      onCancel={onClose}
      onConfirm={() =>
        run(() => archivePeopleRow({ data: { kind, id, archivedOn } }), {
          onResult: onClose,
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
  )
}

/** Archive or reactivate (PPL-02) and delete, on a person's or a group's row or sheet. */
export function PeopleActions({
  kind,
  row,
  placement,
}: {
  kind: PeopleKind
  row: {
    id: string
    name: string
    archivedOn: string | null
    transactionCount?: number
  }
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const { run, busy } = useServerAction()
  const [dialog, setDialog] = useState<'archive' | 'delete' | null>(null)
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
          onClick={() => setDialog('archive')}
        />
      )}
      <IconButton
        icon="trash-full"
        label={t('common.deleteName', { name })}
        onClick={() => setDialog('delete')}
      />
      {dialog === 'archive' && (
        <ArchiveDialog kind={kind} id={id} name={name} onClose={close} />
      )}
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
      >
        {/* Spec 20: their lines stay without a name, so no amount changes. */}
        {(row.transactionCount ?? 0) > 0 && (
          <p className="text-sm">
            {t('people.deleteKeeps', { count: row.transactionCount })}
          </p>
        )}
      </ConfirmDialog>
    </IconActions>
  )
}
