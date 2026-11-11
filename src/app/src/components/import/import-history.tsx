import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '#/components/display/icon-button'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { CollapsedSection } from '#/components/lists/collapsed-section'
import { useServerAction } from '#/hooks/app/use-server-action'
import { useFormatLocale } from '#/hooks/app/use-locale'
import type { ImportBatch } from '#/lib/import/import'
import { cn } from '#/lib/utils'
import { undoImport } from '#/server/import'

function BatchRow({
  batch,
  onUndo,
}: {
  batch: ImportBatch
  onUndo: () => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const day = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
      new Date(iso),
    )
  const undone = batch.undoneAt !== null
  return (
    <li
      className={cn(
        'flex items-center gap-3 py-3 pr-2 pl-4',
        undone && 'text-muted-foreground',
      )}
    >
      <span className="font-semibold">
        {undone && batch.undoneAt
          ? t('import.history.undone', { date: day(batch.undoneAt) })
          : day(batch.committedAt)}
      </span>
      <span className="min-w-0 flex-1 truncate text-right text-sm text-muted-foreground">
        {t('import.transactions', { count: batch.transactions })}
      </span>
      {!undone && (
        <IconButton
          icon="undo"
          label={t('import.history.undo', { date: day(batch.committedAt) })}
          onClick={onUndo}
        />
      )}
    </li>
  )
}

/** The imports made, newest first, each one undone in one action (IMP-05, spec 18). */
export function ImportHistory({
  batches,
}: {
  batches: ReadonlyArray<ImportBatch>
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { run, busy } = useServerAction()
  const [asking, setAsking] = useState<ImportBatch | null>(null)
  const date = asking
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
        new Date(asking.committedAt),
      )
    : ''
  if (batches.length === 0) return null
  return (
    <div className="mt-6">
      <CollapsedSection
        label={`${t('import.history.title')} (${batches.length})`}
        storageKey="import-history-open"
      >
        {batches.map((batch) => (
          <BatchRow
            key={batch.id}
            batch={batch}
            onUndo={() => setAsking(batch)}
          />
        ))}
      </CollapsedSection>
      <ConfirmDialog
        open={asking !== null}
        title={t('import.history.undoTitle', { date })}
        confirmLabel={t('import.history.undoConfirm')}
        description={
          asking
            ? [
                t('import.history.undoDescription', {
                  count: asking.transactions,
                }),
                asking.edited > 0 &&
                  t('import.history.edited', { count: asking.edited }),
              ]
                .filter(Boolean)
                .join(' ')
            : undefined
        }
        busy={busy}
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          if (!asking) return
          run(() => undoImport({ data: { id: asking.id } }), {
            onResult: () => setAsking(null),
            failureText: () => t('import.history.undoFailed'),
          })
        }}
      />
    </div>
  )
}
