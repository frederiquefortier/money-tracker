import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { IconActions, IconButton } from '#/components/icon-button'
import type { ActionPlacement } from '#/components/icon-button'
import { useToast } from '#/components/toaster'
import { useServerAction } from '#/components/use-server-action'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Merchant } from '#/lib/merchants'
import { useLocale } from '#/lib/use-locale'
import { deleteMerchant, mergeMerchants } from '#/server/merchants'

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
  const locale = FORMAT_LOCALE[useLocale()]
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
  const { run, busy } = useServerAction()
  const [dialog, setDialog] = useState<'merge' | 'delete' | null>(null)
  const alone = merchants.length < 2
  const { id, name } = merchant
  const close = () => setDialog(null)

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
        label={t('common.deleteName', { name })}
        onClick={() => setDialog('delete')}
      />
      {dialog === 'merge' && (
        <MergeDialog
          merchant={merchant}
          merchants={merchants}
          onClose={close}
        />
      )}
      <ConfirmDialog
        open={dialog === 'delete'}
        title={t('common.deleteName', { name })}
        confirmLabel={t('common.delete')}
        busy={busy}
        onCancel={close}
        onConfirm={() =>
          run(() => deleteMerchant({ data: { id } }), { onResult: close })
        }
      >
        {merchant.transactionCount > 0 && (
          <p className="text-sm">
            {t('merchants.deleteKeeps', { count: merchant.transactionCount })}
          </p>
        )}
      </ConfirmDialog>
    </IconActions>
  )
}
