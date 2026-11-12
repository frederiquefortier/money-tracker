import { useTranslation } from 'react-i18next'
import { NewItemSections } from '#/components/import/new-item-sections'
import { FormAlert } from '#/components/forms/form-field'
import { Button } from '#/components/ui/button'
import { useLocale } from '#/hooks/app/use-locale'
import { formatDate } from '#/lib/shared/format'
import type { Edit } from '#/lib/import/import-edits'
import type { Decisions } from '#/lib/import/import-merges'
import { summariseRows } from '#/lib/import/import-summary'
import type {
  ImportCheck,
  ImportInput,
  ImportTargets,
  MergeKind,
} from '#/lib/import/import'
import { BigNumber, Tile } from '#/components/import/figure-cards'
import { HoldingsFigures } from '#/components/import/holdings-figures'
import type { HoldingTypeNames } from '#/lib/import/import-names'
import { Spinner } from '#/components/feedback/spinner'

type Checked = Extract<ImportCheck, { ok: true }>

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

/** Step 2: the figures, what would be created, and the import button. */
export function ImportSummary({
  check,
  input,
  decisions,
  targets,
  holdingTypes,
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
  holdingTypes: HoldingTypeNames
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
        holdingTypes={holdingTypes}
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
