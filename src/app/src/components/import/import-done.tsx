import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '#/components/ui/button'
import { cardSurface } from '#/components/styles'
import type { ImportDone as Done } from '#/lib/import/import'
import { cn } from '#/lib/utils'

/** Step 4 (spec 18): how it ended, and where to look. The batch is under Imports. */
export function ImportDone({
  done,
  onAnother,
}: {
  done: Done
  onAnother: () => void
}) {
  const { t } = useTranslation()
  return (
    <section className={cn(cardSurface, 'flex flex-col gap-4 p-4')}>
      <p className="text-lg font-semibold">
        {t('import.done', { count: done.counts.transactions })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/transactions">{t('import.viewTransactions')}</Link>
        </Button>
        <Button variant="outline" onClick={onAnother}>
          {t('import.anotherImport')}
        </Button>
      </div>
    </section>
  )
}
