import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ImportDone } from '#/components/import/import-done'
import { ImportErrors } from '#/components/import/import-errors'
import { ImportFilesCard } from '#/components/import/import-files-card'
import { ImportHistory } from '#/components/import/import-history'
import { ResetChoices } from '#/components/import/reset-choices'
import { ImportSteps } from '#/components/import/import-steps'
import { ImportSummary } from '#/components/import/import-summary'
import { ListPage } from '#/components/layout/list-page'
import { useToast } from '#/hooks/app/use-toast'
import { useImportDecisions } from '#/hooks/import/use-import-decisions'
import { useImportFiles } from '#/hooks/import/use-import-files'
import { useImportRun } from '#/hooks/import/use-import-run'
import { decisionCount } from '#/lib/import/import-merges'
import { stageOf } from '#/lib/import/import-stage'
import { getImports, getImportTargets } from '#/server/import'

export const Route = createFileRoute('/_authed/settings/import')({
  loader: async () => {
    const [batches, targets] = await Promise.all([
      getImports(),
      getImportTargets(),
    ])
    return { batches, targets }
  },
  component: Import,
})

/** IMP-01, 05, 06 (spec 18): upload the files, see what is new and decide, import, undo. */
function Import() {
  const { t } = useTranslation()
  const toast = useToast()
  const { batches, targets } = Route.useLoaderData()
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
  }, [stage])

  function upload() {
    if (files.hasTransactions) void run.runCheck()
    else toast({ text: t('import.missingTransactions') })
  }

  return (
    <ListPage title={t('import.title')}>
      <ImportSteps stage={stage} />
      {stage === 'files' && (
        <section className="flex flex-col gap-4">
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
          {files.errors.length > 0 && (
            <ImportErrors errors={files.errors} count={files.errors.length} />
          )}
          {check && !check.ok && (
            <ImportErrors errors={check.errors} count={check.errorCount} />
          )}
          {check && !check.ok && (
            <ResetChoices count={decisionCount(decisions)} onReset={reset} />
          )}
        </section>
      )}
      {stage === 'import' && check?.ok && (
        <ImportSummary
          check={check}
          input={files.input}
          decisions={decisions}
          targets={targets}
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
        <ImportDone
          done={run.done}
          onAnother={() => {
            run.dismissDone()
            files.clear()
          }}
        />
      )}
      <ImportHistory batches={batches} />
    </ListPage>
  )
}
