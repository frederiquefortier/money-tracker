import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { Button } from '#/components/ui/button'
import { cardSurface } from '#/components/styles'
import { useLocale } from '#/hooks/app/use-locale'
import { formatCount } from '#/lib/shared/format'
import type { ImportDone as Done } from '#/lib/import/import'
import { cn } from '#/lib/utils'

const CREATED = [
  'institutions',
  'accounts',
  'categories',
  'merchants',
  'people',
  'events',
  'aliases',
] as const

/** How it ended: what was written, line by line, and where to look. */
export function ImportDone({
  done,
  onAnother,
}: {
  done: Done
  onAnother: () => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const lines = CREATED.flatMap((kind) => {
    const count = done.created[kind] ?? 0
    return count > 0 ? [{ kind, count }] : []
  })
  return (
    <section
      className={cn(
        cardSurface,
        'flex flex-col items-center gap-5 px-5 pt-8 pb-5',
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-income/10 text-income [&_svg]:size-8">
        <Icon name="check" />
      </span>
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-lg font-semibold">{t('import.doneTitle')}</h2>
        <p className="text-muted-foreground">
          {t('import.doneCount', { count: done.counts.transactions })}
        </p>
      </div>
      {lines.length > 0 && (
        <dl className="w-full divide-y border-y">
          {lines.map(({ kind, count }) => (
            <div
              key={kind}
              className="flex items-center justify-between py-2.5"
            >
              <dt>{t(`import.createdLabels.${kind}`)}</dt>
              <dd className="font-mono font-semibold">
                {formatCount(count, locale)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex w-full flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onAnother}>
          {t('import.anotherImport')}
        </Button>
        <Button asChild>
          <Link to="/transactions">{t('import.viewTransactions')}</Link>
        </Button>
      </div>
    </section>
  )
}
