import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { useServerAction } from '#/hooks/app/use-server-action'
import type { Merchant } from '#/lib/merchants/merchant'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { deleteMerchant, mergeMerchants } from '#/server/merchants'
import { useToast } from '#/hooks/app/use-toast'

/** MER-05: the chosen merchant keeps its name and default category. */
function MergeDialog({
  merchant,
  merchants,
  onClose,
}: {
  merchant: Merchant
  merchants: ReadonlyArray<Merchant>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { run, busy } = useServerAction()
  const [target, setTarget] = useState<string | null>(null)
  const targetName = merchants.find((m) => m.id === target)?.name
  const options = merchants
    .filter((m) => m.id !== merchant.id)
    .map((m) => ({ value: m.id, label: m.name }))
    .sort((a, b) => a.label.localeCompare(b.label, locale))

  return (
    <ConfirmDialog
      open
      title={t('merchants.mergeName', { name: merchant.name })}
      confirmLabel={t('merchants.merge')}
      irreversible={false}
      busy={busy}
      canConfirm={target !== null}
      onCancel={onClose}
      onConfirm={() => {
        if (target)
          run(() => mergeMerchants({ data: { source: merchant.id, target } }), {
            onResult: onClose,
          })
      }}
    >
      <Combobox
        label={t('merchants.mergeInto')}
        required
        options={options}
        value={target}
        onChange={setTarget}
        clearLabel={t('common.clear')}
      />
      {targetName && (
        <p className="text-sm">
          {t('merchants.mergeEffect', {
            source: merchant.name,
            target: targetName,
          })}
        </p>
      )}
    </ConfirmDialog>
  )
}

/** Merge and delete, as icons on the merchant's row or its sheet (spec 13). */
export function MerchantActions({
  merchant,
  merchants,
  placement,
}: {
  merchant: Merchant
  merchants: ReadonlyArray<Merchant>
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const [dialog, setDialog] = useState<'merge' | 'delete' | null>(null)
  const alone = merchants.length < 2
  const { id, name } = merchant
  const close = () => setDialog(null)
  const deleteLabel = t('common.deleteName', { name })

  return (
    <IconActions slots={2} placement={placement}>
      <IconButton
        icon="merge"
        label={t('merchants.mergeName', { name })}
        muted={alone}
        onClick={() =>
          alone
            ? toast({ text: t('merchants.mergeAlone') })
            : setDialog('merge')
        }
      />
      <IconButton
        icon="trash-full"
        label={deleteLabel}
        onClick={() => setDialog('delete')}
      />
      {dialog === 'merge' && (
        <MergeDialog
          merchant={merchant}
          merchants={merchants}
          onClose={close}
        />
      )}
      <DeleteDialog
        open={dialog === 'delete'}
        title={deleteLabel}
        description={
          merchant.transactionCount > 0
            ? t('merchants.deleteKeeps', { count: merchant.transactionCount })
            : undefined
        }
        onDelete={() => deleteMerchant({ data: { id } })}
        onClose={close}
      />
    </IconActions>
  )
}
