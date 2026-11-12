import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import { IconButton } from '#/components/display/icon-button'
import { Money } from '#/components/display/money'
import { deleteHoldingTransfer } from '#/server/holding-entries'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { fieldCard } from '#/components/styles'
import type { HoldingTransfer } from '#/lib/holdings/holding'

function TransferRow({
  transfer,
  other,
  currency,
}: {
  transfer: HoldingTransfer
  other: string
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [asking, setAsking] = useState(false)
  const date = formatDate(transfer.onDate, locale, 'medium')
  const title = t('holdings.deleteTransfer', { date })
  return (
    <li className="flex min-h-12 items-center gap-3 pr-2 pl-3">
      <span className="min-w-0 flex-1 truncate">
        {date}
        <span className="text-muted-foreground">
          {' '}
          · {transfer.outgoing ? '→' : '←'} {other}
        </span>
      </span>
      <Money
        amount={transfer.outgoing ? `-${transfer.amount}` : transfer.amount}
        currency={currency}
        className="font-semibold"
      />
      <IconButton
        icon="trash-full"
        label={title}
        onClick={() => setAsking(true)}
      />
      <DeleteDialog
        open={asking}
        title={title}
        onDelete={() => deleteHoldingTransfer({ data: { id: transfer.id } })}
        onClose={() => setAsking(false)}
      />
    </li>
  )
}

/** A holding's transfers, out (→) and in (←), each with the holding on the other side. */
export function TransferList({
  transfers,
  labels,
  currency,
}: {
  transfers: ReadonlyArray<HoldingTransfer>
  labels: ReadonlyMap<string, string>
  currency: string
}) {
  const { t } = useTranslation()
  if (transfers.length === 0) return null
  return (
    <div
      role="group"
      aria-label={t('holdings.transfers')}
      className={fieldCard}
    >
      <ul className="divide-y">
        {transfers.map((transfer) => (
          <TransferRow
            key={transfer.id}
            transfer={transfer}
            other={labels.get(transfer.other) ?? ''}
            currency={currency}
          />
        ))}
      </ul>
    </div>
  )
}
