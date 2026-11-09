import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { useServerAction } from '#/hooks/app/use-server-action'
import { accountLabel } from '#/lib/accounts/account'
import { formatDate, formatMoney } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { deleteAdjustment } from '#/server/adjustments'

export type AdjustmentSummary = {
  id: string
  occurredOn: string
  amount: string
  currency: string
  account: { name: string; institution: string | null }
}

/** Delete, on the adjustment's row (spec 14) or in its sheet on phones (TRX-03). */
export function AdjustmentActions({
  summary,
  placement,
}: {
  summary: AdjustmentSummary
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { run, busy } = useServerAction()
  const [confirming, setConfirming] = useState(false)

  return (
    <IconActions slots={1} placement={placement}>
      <IconButton
        icon="trash-full"
        label={t('transactions.adjustment.deleteLabel')}
        onClick={() => setConfirming(true)}
      />
      <ConfirmDialog
        open={confirming}
        title={t('transactions.adjustment.deleteTitle', {
          amount: formatMoney(summary.amount, summary.currency, locale),
          date: formatDate(summary.occurredOn, locale),
        })}
        description={t('transactions.adjustment.deleteText', {
          account: `“${accountLabel(summary.account)}”`,
        })}
        confirmLabel={t('common.delete')}
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          run(() => deleteAdjustment({ data: { id: summary.id } }), {
            onResult: () => setConfirming(false),
          })
        }
      />
    </IconActions>
  )
}
