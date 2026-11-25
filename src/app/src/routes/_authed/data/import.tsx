import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ExportCard } from '#/components/import/export-card'
import { ImportReport } from '#/components/import/import-report'
import { ImportErrors } from '#/components/import/import-errors'
import { ImportFilesCard } from '#/components/import/import-files-card'
import { ImportHistory } from '#/components/import/import-history'
import { ImportSteps } from '#/components/import/import-steps'
import { ImportSummary } from '#/components/import/import-summary'
import { ListPage } from '#/components/layout/list-page'
import { TabList, TabPanel } from '#/components/lists/tab-list'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { useToast } from '#/hooks/app/use-toast'
import { useImportDecisions } from '#/hooks/import/use-import-decisions'
import { useImportFiles } from '#/hooks/import/use-import-files'
import { useImportRun } from '#/hooks/import/use-import-run'
import { decisionCount } from '#/lib/import/import-merges'
import { stageOf } from '#/lib/import/import-stage'
import { oneOf } from '#/lib/shared/collections'
import {
  getHoldingTypeNames,
  getImports,
  getImportTargets,
} from '#/server/import'
import { listPagePending } from '#/components/layout/page-pending'
import { ImportSkeleton } from '#/components/import/import-skeleton'

export const Route = createFileRoute('/_authed/data/import')({
  ...listPagePending((t) => t('import.title'), { body: ImportSkeleton }),
  loader: async () => {
    const [batches, targets, holdingTypes] = await Promise.all([
      getImports(),
      getImportTargets(),
      getHoldingTypeNames(),
    ])
    return { batches, targets, holdingTypes }
  },
  component: DataPage,
})

const TABS = ['import', 'export'] as const
type Tab = (typeof TABS)[number]
const parseTab = oneOf(TABS)
const PANEL_ID = 'data-panel'

/** Importer and Exporter, one tab each (IMP-04). */
function DataPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useStoredState<Tab>('data.tab', 'import', parseTab)
  return (
    <ListPage title={t('import.title')}>
      <TabList
        label={t('import.tabsLabel')}
        tabs={TABS}
        value={tab}
        labelOf={(value) => t(`import.tabs.${value}`)}
        panelId={PANEL_ID}
        idPrefix="data-tab"
        onSelect={setTab}
      />
      <TabPanel id={PANEL_ID} idPrefix="data-tab" tab={tab}>
        {tab === 'import' ? <ImportTab /> : <ExportCard />}
      </TabPanel>
    </ListPage>
  )
}

/** IMP-01, 05, 06: upload the files, see what is new and decide, import, undo. */
function ImportTab() {
  const { t } = useTranslation()
  const toast = useToast()
  const { batches, targets, holdingTypes } = Route.useLoaderData()
  const files = useImportFiles()
  const { decisions, setMerge, setEdit, setNote, setPerson, reset } =
    useImportDecisions()
  const run = useImportRun(files.input, decisions)
  const { check } = run
  const stage = stageOf({ done: run.done !== null, check })

  // Written: the choices were about items that now exist.
  const finished = run.done !== null
  useEffect(() => {
    if (finished) reset()
  }, [finished, reset])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [stage, run.refusal, check])

  function upload() {
    if (files.hasContent) void run.runCheck()
    else toast({ text: t('import.missingTransactions') })
  }

  return (
    <>
      <ImportSteps stage={stage} />
      {stage === 'files' && (
        <section className="flex flex-col gap-4">
          {files.errors.length > 0 && (
            <ImportErrors errors={files.errors} count={files.errors.length} />
          )}
          {check && !check.ok && (
            <ImportErrors errors={check.errors} count={check.errorCount} />
          )}
          <ImportFilesCard
            files={files.files}
            uploading={run.busy === 'checking'}
            canUpload={files.files.length > 0 && files.errors.length === 0}
            onPick={(chosen) => {
              run.dismissDone()
              void files.pick(chosen)
            }}
            onRemove={files.remove}
            onUpload={upload}
          />
        </section>
      )}
      {stage === 'import' && run.refusal && (
        <ImportErrors
          errors={run.refusal.errors}
          count={run.refusal.count}
          choices={{ count: decisionCount(decisions), onReset: reset }}
        />
      )}
      {stage === 'import' && check?.ok && (
        <ImportSummary
          check={check}
          input={files.input}
          decisions={decisions}
          {...{ targets, holdingTypes }}
          importing={run.busy === 'importing'}
          onMerge={setMerge}
          onEdit={setEdit}
          onPerson={setPerson}
          onNote={setNote}
          onImport={() => void run.runImport()}
          onChangeFiles={run.reset}
        />
      )}
      {run.done && (
        <ImportReport
          done={run.done}
          onAnother={() => {
            run.dismissDone()
            files.clear()
          }}
        />
      )}
      <ImportHistory batches={batches} />
    </>
  )
}
