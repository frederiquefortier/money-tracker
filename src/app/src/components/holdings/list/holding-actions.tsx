import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArchiveDialog } from '#/components/feedback/archive-dialog'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import {
  IconActions,
  IconButton,
  IconLink,
} from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { useToast } from '#/hooks/app/use-toast'
import { useServerAction } from '#/hooks/app/use-server-action'
import { closeHolding, deleteHolding, reopenHolding } from '#/server/holdings'
import type { Holding } from '#/lib/holdings/holding'

type RowHolding = Pick<
  Holding,
  'id' | 'kind' | 'currency' | 'closedOn' | 'inUse'
> & {
  /** The name, or what stands in for it. */
  label: string
}

/** The values, and on an investment its external contributions and their transfer. */
function EntryLinks({ holding, name }: { holding: RowHolding; name: string }) {
  const { t } = useTranslation()
  const { id } = holding
  return (
    <>
      <IconLink
        icon="chart-line"
        label={t('holdings.valuesOf', { name })}
        text={t('holdings.values')}
        to="/net-worth/holdings/$holdingId/values"
        params={{ holdingId: id }}
      />
      {holding.kind === 'investment' && (
        <>
          <IconLink
            icon="coins"
            label={t('holdings.contributionsOf', { name })}
            text={t('holdings.contributions')}
            to="/net-worth/holdings/$holdingId/contributions"
            params={{ holdingId: id }}
          />
          <IconLink
            icon="arrow-left-right"
            label={t('holdings.transferOf', { name })}
            text={t('holdings.transfers')}
            to="/net-worth/holdings/$holdingId/transfer"
            params={{ holdingId: id }}
          />
        </>
      )}
    </>
  )
}

/** The toast for a refused archive or delete. */
function useFailureText(currency: string) {
  const { t } = useTranslation()
  return (error: string) => {
    if (error === 'inUse') return t('holdings.inUse')
    if (error === 'closedBeforeEntry') return t('holdings.closedBeforeEntry')
    if (error === 'currencyRemoved')
      return t('holdings.currencyRemoved', { code: currency })
    return undefined
  }
}

/**
 * Values, external contributions and their transfer, archive or reactivate, and delete, as
 * icons on the holding's row or its sheet. Contributions only exist on an investment.
 */
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
  const failureText = useFailureText(holding.currency)

  return (
    <>
      <IconActions
        slots={5}
        placement={placement}
        menuLabel={t('common.actionsOf', { name })}
        className={className}
      >
        <EntryLinks holding={holding} name={name} />
        {holding.closedOn ? (
          <IconButton
            icon="undo"
            label={t('common.reactivateName', { name })}
            text={t('common.reactivate')}
            onClick={() =>
              run(() => reopenHolding({ data: { id } }), { failureText })
            }
          />
        ) : (
          <IconButton
            icon="archive"
            label={archiveLabel}
            text={t('common.archive')}
            onClick={() => setDialog('close')}
          />
        )}
        <IconButton
          icon="trash-full"
          text={t('common.delete')}
          label={holding.inUse ? t('holdings.inUse') : deleteLabel}
          muted={holding.inUse}
          onClick={() =>
            holding.inUse
              ? toast({ text: t('holdings.inUse') })
              : setDialog('delete')
          }
        />
      </IconActions>
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
    </>
  )
}
