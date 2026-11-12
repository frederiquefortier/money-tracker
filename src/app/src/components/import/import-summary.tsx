import { useTranslation } from 'react-i18next'
import { NewItemSections } from '#/components/import/new-item-sections'
import { FormAlert } from '#/components/forms/form-field'
import { Button } from '#/components/ui/button'
import { cardSurface } from '#/components/styles'
import { useLocale } from '#/hooks/app/use-locale'
import { formatCount, formatDate } from '#/lib/shared/format'
import type { Edit } from '#/lib/import/import-edits'
import type { Decisions } from '#/lib/import/import-merges'
import { holdingsRange, summariseRows } from '#/lib/import/import-summary'
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

function BigNumber({ value, label }: { value: number; label: string }) {
  const locale = useLocale()
  return (
    <div
      className={cn(cardSurface, 'flex flex-col items-center gap-1 px-4 py-5')}
    >
      <span className="font-mono text-4xl font-bold">
        {formatCount(value, locale)}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

/** The file's figures first, then the lines that qualify them. */
function Figures({ input, check }: { input: ImportInput; check: Checked }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const rows = summariseRows(input.transactions)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">
          {t('import.tiles.transactions')}
        </h2>
        {check.counts.skipped > 0 && (
          <FormAlert tone="warning" size="tag">
            {t('import.skipped', { count: check.counts.skipped })}
          </FormAlert>
        )}
      </div>
      <BigNumber
        value={input.transactions.length}
        label={t('import.tiles.transactions')}
      />
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
      </div>
    </div>
  )
}

/** What the holdings files bring, in the same cards as the transactions. */
function HoldingsFigures({
  check,
  input,
}: {
  check: Checked
  input: ImportInput
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { counts, willCreate } = check
  const range = holdingsRange(input)
  const tiles = [
    {
      value: counts.holdings + counts.holdingsMatched,
      label: t('import.tiles.holdingsCount'),
    },
    {
      value: input.contributions.length,
      label: t('import.tiles.contributions'),
    },
    {
      value: input.holding_transfers.length,
      label: t('import.tiles.holdingTransfers'),
    },
  ].filter((tile) => tile.value > 0)
  const values = input.snapshots.length
  if (values + tiles.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t('import.tiles.holdings')}</h2>
        {counts.holdingRowsSkipped > 0 && (
          <FormAlert tone="warning" size="tag">
            {t('import.skipped', { count: counts.holdingRowsSkipped })}
          </FormAlert>
        )}
      </div>
      {values > 0 && (
        <BigNumber value={values} label={t('import.tiles.snapshots')} />
      )}
      {tiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-flow-col sm:auto-cols-fr">
          {tiles.map((tile) => (
            <Tile key={tile.label} value={tile.value} label={tile.label} />
          ))}
        </div>
      )}
      <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
        {range.from && range.to && (
          <p>
            {t('import.range', {
              from: formatDate(range.from, locale, 'medium'),
              to: formatDate(range.to, locale, 'medium'),
            })}
          </p>
        )}
        {willCreate.holdings.length > 0 && (
          <p>
            {willCreate.holdings
              .map((h) =>
                [h.name ?? h.type, h.institution].filter(Boolean).join(' · '),
              )
              .join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}

/** Step 2: the figures, what would be created, and the import button. */
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
      {input.transactions.length > 0 && <Figures input={input} check={check} />}
      <HoldingsFigures check={check} input={input} />
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
          {t('import.importNow')}
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
