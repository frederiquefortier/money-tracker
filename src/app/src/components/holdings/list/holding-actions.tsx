import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArchiveDialog } from '#/components/feedback/archive-dialog'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { useToast } from '#/hooks/app/use-toast'
import { useServerAction } from '#/hooks/app/use-server-action'
import { closeHolding, deleteHolding, reopenHolding } from '#/server/holdings'
import type { Holding } from '#/lib/holdings/holding'

type RowHolding = Pick<Holding, 'id' | 'currency' | 'closedOn' | 'inUse'> & {
  /** The name, or what stands in for it. */
  label: string
}

/** Archive or reactivate and delete, as icons on the holding's row or its sheet. */
export function HoldingActions({
  holding,
  placement,
  className,
}: {
  holding: RowHolding
  placement?: ActionPlacement
  className?: string
}) {
  const { t } = useTranslation()
  const { run } = useServerAction()
  const toast = useToast()
  const [dialog, setDialog] = useState<'close' | 'delete' | null>(null)
  const { id, label: name } = holding
  const close = () => setDialog(null)
  const archiveLabel = t('common.archiveName', { name })
  const deleteLabel = t('common.deleteName', { name })
  const failureText = (error: string) => {
    if (error === 'inUse') return t('holdings.inUse')
    if (error === 'closedBeforeEntry') return t('holdings.closedBeforeEntry')
    if (error === 'currencyRemoved')
      return t('holdings.currencyRemoved', { code: holding.currency })
    return undefined
  }

  return (
    <IconActions slots={2} placement={placement} className={className}>
      {holding.closedOn ? (
        <IconButton
          icon="undo"
          label={t('common.reactivateName', { name })}
          onClick={() =>
            run(() => reopenHolding({ data: { id } }), { failureText })
          }
        />
      ) : (
        <IconButton
          icon="archive"
          label={archiveLabel}
          onClick={() => setDialog('close')}
        />
      )}
      <IconButton
        icon="trash-full"
        label={holding.inUse ? t('holdings.inUse') : deleteLabel}
        muted={holding.inUse}
        onClick={() =>
          holding.inUse
            ? toast({ text: t('holdings.inUse') })
            : setDialog('delete')
        }
      />
      {dialog === 'close' && (
        <ArchiveDialog
          title={archiveLabel}
          dateLabel={t('holdings.closedOnField')}
          failureText={failureText}
          onArchive={(closedOn) => closeHolding({ data: { id, closedOn } })}
          onClose={close}
        />
      )}
      <DeleteDialog
        open={dialog === 'delete'}
        title={deleteLabel}
        failureText={failureText}
        onDelete={() => deleteHolding({ data: { id } })}
        onClose={close}
      />
    </IconActions>
  )
}
