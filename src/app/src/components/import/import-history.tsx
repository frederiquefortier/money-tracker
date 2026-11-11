import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '#/components/display/icon-button'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { EmptyState, ListCard } from '#/components/lists/list-card'
import { useServerAction } from '#/hooks/app/use-server-action'
import { useFormatLocale } from '#/hooks/app/use-locale'
import type { ImportBatch } from '#/lib/import/import'
import { cn } from '#/lib/utils'
import { undoImport } from '#/server/import'

const CREATED_KINDS = [
  'institutions',
  'accounts',
  'categories',
  'merchants',
  'people',
  'events',
  'aliases',
] as const

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
  const created = CREATED_KINDS.flatMap((kind) => {
    const count = batch.created[kind] ?? 0
    return count > 0 ? [t(`import.created.${kind}`, { count })] : []
  })
  const second = [
    t('import.transactions', { count: batch.transactions }),
    ...created,
  ].join(', ')
  return (
    <li
      className={cn(
        'flex items-center gap-2 py-3 pr-2 pl-4',
        undone && 'text-muted-foreground',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">
          {undone && batch.undoneAt
            ? t('import.history.undone', { date: day(batch.undoneAt) })
            : day(batch.committedAt)}
        </span>
        <span className="text-sm text-muted-foreground">{second}</span>
      </div>
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
  return (
    <section className="mt-6 flex flex-col gap-3 border-t pt-8">
      <h2 className="font-mono text-sm font-bold tracking-wide uppercase">
        {t('import.history.title')}
      </h2>
      {batches.length === 0 ? (
        <EmptyState>{t('import.history.empty')}</EmptyState>
      ) : (
        <ListCard>
          {batches.map((batch) => (
            <BatchRow
              key={batch.id}
              batch={batch}
              onUndo={() => setAsking(batch)}
            />
          ))}
        </ListCard>
      )}
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
    </section>
  )
}
