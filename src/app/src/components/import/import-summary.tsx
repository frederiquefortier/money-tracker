import { useTranslation } from 'react-i18next'
import { NewItemSections } from '#/components/import/new-item-sections'
import { Button } from '#/components/ui/button'
import { cardSurface } from '#/components/styles'
import { useLocale } from '#/hooks/app/use-locale'
import { formatCount, formatDate } from '#/lib/shared/format'
import type { Edit } from '#/lib/import/import-edits'
import type { Decisions } from '#/lib/import/import-merges'
import { summariseRows } from '#/lib/import/import-summary'
import type {
  ImportCheck,
  ImportInput,
  ImportTargets,
  MergeKind,
} from '#/lib/import/import'
import { cn } from '#/lib/utils'
import { Spinner } from '#/components/feedback/spinner'

type Checked = Extract<ImportCheck, { ok: true }>

function Tile({
  value,
  label,
  className,
}: {
  value: number
  label: string
  className?: string
}) {
  const locale = useLocale()
  return (
    <div
      className={cn(
        cardSurface,
        'flex flex-col items-center gap-1 p-3',
        className,
      )}
    >
      <span className="font-mono text-2xl font-bold">
        {formatCount(value, locale)}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

/** The file's figures first (spec 18), then the lines that qualify them. */
function Figures({ input, check }: { input: ImportInput; check: Checked }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const rows = summariseRows(input.transactions)
  return (
    <>
      <div
        className={cn(
          cardSurface,
          'flex flex-col items-center gap-1 px-4 py-5',
        )}
      >
        <span className="font-mono text-4xl font-bold">
          {formatCount(input.transactions.length, locale)}
        </span>
        <span className="text-muted-foreground">
          {t('import.tiles.transactions')}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-flow-col sm:auto-cols-fr">
        <Tile value={rows.expenses} label={t('import.tiles.expenses')} />
        <Tile value={rows.incomes} label={t('import.tiles.incomes')} />
        <Tile value={rows.transfers} label={t('import.tiles.transfers')} />
        {rows.adjustments > 0 && (
          <Tile
            value={rows.adjustments}
            label={t('import.tiles.adjustments')}
            className="col-span-2 sm:col-span-1"
          />
        )}
      </div>
      <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
        {rows.from && rows.to && (
          <p>
            {t('import.range', {
              from: formatDate(rows.from, locale, 'medium'),
              to: formatDate(rows.to, locale, 'medium'),
            })}
          </p>
        )}
        {check.counts.skipped > 0 && (
          <p>{t('import.skipped', { count: check.counts.skipped })}</p>
        )}
      </div>
    </>
  )
}

/** Step 2 (spec 18): the figures, what would be created, and the import button. */
export function ImportSummary({
  check,
  input,
  decisions,
  targets,
  importing,
  onMerge,
  onEdit,
  onPerson,
  onNote,
  onImport,
  onChangeFiles,
}: {
  check: Checked
  input: ImportInput
  decisions: Decisions
  targets: ImportTargets
  importing: boolean
  onMerge: (kind: MergeKind, key: string, target: string | null) => void
  onEdit: (kind: MergeKind, key: string, edit: Edit | null) => void
  onPerson: (key: string, name: string | null) => void
  onNote: (kind: MergeKind, key: string, edit: Edit | null) => void
  onImport: () => void
  onChangeFiles: () => void
}) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-6">
      <Figures input={input} check={check} />
      {check.nothingToImport && (
        <p className="text-center font-semibold">
          {t('import.nothingToImport')}
        </p>
      )}
      <NewItemSections
        will={check.willCreate}
        input={input}
        decisions={decisions}
        targets={targets}
        onMerge={onMerge}
        onEdit={onEdit}
        onPerson={onPerson}
        onNote={onNote}
      />
      {!check.nothingToImport && (
        <Button
          size="lg"
          className="self-center"
          disabled={importing}
          onClick={onImport}
        >
          {importing && <Spinner />}
          {t('import.importNow', { count: check.counts.transactions })}
        </Button>
      )}
      <Button
        variant="link"
        size="sm"
        className="self-center text-muted-foreground"
        onClick={onChangeFiles}
      >
        {t('import.changeFiles', { count: input.files.length })}
      </Button>
    </section>
  )
}
