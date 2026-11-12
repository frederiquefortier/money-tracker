import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import { IconButton } from '#/components/display/icon-button'
import { Money } from '#/components/display/money'
import { CreateButton } from '#/components/forms/create-row'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'
import { fieldCard, focusRing, rowHover } from '#/components/styles'
import type { Result } from '#/lib/shared/result'

export type EntryKind = 'snapshot' | 'contribution'
type Row = { id: string; onDate: string; amount: string; label?: string | null }

function EntryRow({
  row,
  currency,
  onOpen,
  onDelete,
}: {
  row: Row
  currency: string
  onOpen: () => void
  onDelete: () => Promise<Result<string>>
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [asking, setAsking] = useState(false)
  const date = formatDate(row.onDate, locale, 'medium')
  return (
    <li className={cn('flex items-center pr-2', rowHover)}>
      <button
        type="button"
        aria-label={t('holdings.editEntry', { date })}
        onClick={onOpen}
        className={cn(
          'flex min-h-12 min-w-0 flex-1 items-center gap-3 pl-3 text-left',
          focusRing,
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          {date}
          {row.label && (
            <span className="text-muted-foreground"> · {row.label}</span>
          )}
        </span>
        <Money
          amount={row.amount}
          currency={currency}
          className="font-semibold"
        />
      </button>
      <IconButton
        icon="trash-full"
        label={t('holdings.deleteEntry', { date })}
        onClick={() => setAsking(true)}
      />
      <DeleteDialog
        open={asking}
        title={t('holdings.deleteEntry', { date })}
        onDelete={onDelete}
        onClose={() => setAsking(false)}
      />
    </li>
  )
}

/** The dated rows of a holding's values or external contributions, and the row that adds one. */
export function EntryList({
  label,
  addLabel,
  rows,
  currency,
  onOpen,
  onDelete,
}: {
  label: string
  addLabel: string
  rows: ReadonlyArray<Row>
  currency: string
  onOpen: (id: string | null) => void
  onDelete: (id: string) => Promise<Result<string>>
}) {
  return (
    <div role="group" aria-label={label}>
      <div className={fieldCard}>
        <CreateButton label={addLabel} onClick={() => onOpen(null)} />
        {rows.length > 0 && (
          <ul className="divide-y border-t">
            {rows.map((row) => (
              <EntryRow
                key={row.id}
                row={row}
                currency={currency}
                onOpen={() => onOpen(row.id)}
                onDelete={() => onDelete(row.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
