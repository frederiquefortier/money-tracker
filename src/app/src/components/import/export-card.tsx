import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconBubble } from '#/components/display/icon-bubble'
import { Spinner } from '#/components/feedback/spinner'
import { CheckList } from '#/components/forms/check-list'
import { FILE_ICON } from '#/components/import/import-files-card'
import { cardSurface } from '#/components/styles'
import { Button } from '#/components/ui/button'
import { useExport, useExportCounts } from '#/hooks/import/use-export'
import { IMPORT_FILES } from '#/lib/import/import'
import { cn } from '#/lib/utils'

/** IMP-04, SEC-04: the files of the import format to download, all ticked at first. */
export function ExportCard() {
  const { t } = useTranslation()
  const { run, busy } = useExport()
  const counts = useExportCounts()
  const [picked, setPicked] = useState<ReadonlySet<string>>(
    () => new Set(IMPORT_FILES),
  )
  const chosen = IMPORT_FILES.filter((name) => picked.has(name))

  function toggle(id: string) {
    setPicked((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  return (
    <section className={cn(cardSurface, 'flex flex-col')}>
      <div className="p-4">
        <CheckList
          nodes={IMPORT_FILES.map((name) => ({
            id: name,
            label: `${name}.csv`,
            icon: <IconBubble icon={FILE_ICON[name]} />,
            detail: counts
              ? t('import.rows', { count: counts[name] })
              : undefined,
          }))}
          stateOf={(node) => (picked.has(node.id) ? 'on' : 'off')}
          onToggle={(node) => toggle(node.id)}
        />
      </div>
      <div className="flex justify-end border-t p-4">
        <Button
          disabled={busy || chosen.length === 0}
          onClick={() => run(chosen)}
        >
          {busy && <Spinner />}
          {t('import.export.action')}
        </Button>
      </div>
    </section>
  )
}
