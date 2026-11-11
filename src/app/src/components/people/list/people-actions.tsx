import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArchiveDialog } from '#/components/feedback/archive-dialog'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { PeopleMergeDialog } from '#/components/people/list/people-merge-dialog'
import { useServerAction } from '#/hooks/app/use-server-action'
import { usePeoplePage } from '#/hooks/app/use-page-data'
import { useToast } from '#/hooks/app/use-toast'
import { archivePeopleRow, deletePeopleRow } from '#/server/people'

export type PeopleKind = 'person' | 'group'

function MergeAction({ person }: { person: { id: string; name: string } }) {
  const { t } = useTranslation()
  const toast = useToast()
  const { people } = usePeoplePage()
  const [open, setOpen] = useState(false)
  const alone = people.length < 2

  return (
    <>
      <IconButton
        icon="merge"
        label={t('people.mergeName', { name: person.name })}
        muted={alone}
        onClick={() =>
          alone ? toast({ text: t('people.mergeAlone') }) : setOpen(true)
        }
      />
      {open && (
        <PeopleMergeDialog
          person={person}
          people={people}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

/** Archive or reactivate (PPL-02), merge (PPL-07, people only) and delete, on a person's or a group's row or sheet. */
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
  const { run } = useServerAction()
  const [dialog, setDialog] = useState<'archive' | 'delete' | null>(null)
  const { id, name } = row
  const close = () => setDialog(null)
  const archiveLabel = t('common.archiveName', { name })
  const deleteLabel = t('common.deleteName', { name })

  return (
    <IconActions slots={kind === 'person' ? 3 : 2} placement={placement}>
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
          label={archiveLabel}
          onClick={() => setDialog('archive')}
        />
      )}
      {kind === 'person' && <MergeAction person={row} />}
      <IconButton
        icon="trash-full"
        label={deleteLabel}
        onClick={() => setDialog('delete')}
      />
      {dialog === 'archive' && (
        <ArchiveDialog
          title={archiveLabel}
          dateLabel={t('people.archivedOnField')}
          onArchive={(archivedOn) =>
            archivePeopleRow({ data: { kind, id, archivedOn } })
          }
          onClose={close}
        />
      )}
      <DeleteDialog
        open={dialog === 'delete'}
        title={deleteLabel}
        // Spec 20: their lines stay without a name, so no amount changes.
        description={
          (row.transactionCount ?? 0) > 0
            ? t('people.deleteKeeps', { count: row.transactionCount })
            : undefined
        }
        onDelete={() => deletePeopleRow({ data: { kind, id } })}
        onClose={close}
      />
    </IconActions>
  )
}
