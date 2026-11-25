import { useTranslation } from 'react-i18next'
import { cardSurface, fieldCard } from '#/components/styles'
import { cn } from '#/lib/utils'

/**
 * A pulsing bar where text is on its way, one line tall at the text's size; set its width
 * to the text's usual length. Decorative unless `label` is set, which announces it.
 */
export function Skeleton({
  label,
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block h-[1em] w-16 animate-pulse rounded bg-muted align-middle motion-reduce:animate-none',
        className,
      )}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'status' : undefined}
    />
  )
}

/** A list's rows while they load, in the card and at the height of `CheckList`'s. */
export function SkeletonRows({ count = 5 }: { count?: number }) {
  const { t } = useTranslation()
  return (
    <div className={fieldCard} role="status" aria-label={t('common.loading')}>
      <ul className="divide-y" aria-hidden>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="flex min-h-12 items-center gap-3 px-3">
            <Skeleton className={cn('flex-none', i % 2 ? 'w-24' : 'w-36')} />
            <span className="flex-1" />
            <Skeleton className="size-5 rounded-field" />
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Groups in cards while they load, at `DrawerHeader`'s height: the name and its total,
 * then the rows with their amount. `rows` gives each card's row count.
 */
export function SkeletonDrawers({
  rows = [3, 2, 2],
}: {
  rows?: ReadonlyArray<number>
}) {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-label={t('common.loading')}
    >
      {rows.map((count, i) => (
        <section key={i} className={cardSurface} aria-hidden>
          <div className="flex min-h-12 items-center gap-2 py-1.5 pr-4 pl-3">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className={cn('font-bold', i % 2 ? 'w-20' : 'w-28')} />
            <span className="flex-1" />
            <Skeleton className="w-24 text-lg" />
          </div>
          <ul className="divide-y border-t">
            {Array.from({ length: count }, (_, j) => (
              <li key={j} className="flex min-h-12 items-center gap-3 px-4">
                <Skeleton className={j % 2 ? 'w-24' : 'w-36'} />
                <span className="flex-1" />
                <Skeleton className="w-20" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** A chart's card while it loads: its title, then a block at the chart's height. */
export function SkeletonCard({ chart = 'h-64' }: { chart?: string }) {
  return (
    <div className={cn(cardSurface, 'flex flex-col gap-4 p-4')} aria-hidden>
      <Skeleton className="w-32" />
      <Skeleton className={cn('block w-full rounded-lg', chart)} />
    </div>
  )
}

/**
 * A list page's body while it loads: the search field and the tab bar it has, then
 * `count` rows in a list card, each drawn by `row`.
 */
export function SkeletonListPage({
  search = false,
  tabs = 0,
  count = 6,
  row,
}: {
  search?: boolean
  tabs?: number
  count?: number
  row: (i: number) => React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-label={t('common.loading')}
    >
      {search && (
        <Skeleton className="block h-11 w-full rounded-field md:h-9" />
      )}
      {tabs > 0 && <SkeletonTabs count={tabs} />}
      <ul className={cn(cardSurface, 'divide-y')} aria-hidden>
        {Array.from({ length: count }, (_, i) => row(i))}
      </ul>
    </div>
  )
}

/**
 * A `ListRow` while it loads: its lead (a badge or avatar, at its size), the name, and
 * the line under it when the row has one. Each bar sits in a line of its text's height.
 */
export function SkeletonNameRow({
  i,
  lead,
  detail = true,
}: {
  i: number
  lead?: string
  detail?: boolean
}) {
  return (
    <li className="flex items-center gap-3 py-3 pr-2 pl-4">
      {lead && <Skeleton className={cn('flex-none rounded-full', lead)} />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span>
          <Skeleton className={i % 2 ? 'w-28' : 'w-36'} />
        </span>
        {detail && (
          <span className="text-sm">
            <Skeleton className={i % 3 ? 'w-24' : 'w-32'} />
          </span>
        )}
      </span>
    </li>
  )
}

/** A `TabList` while its page loads, one cell per tab. */
export function SkeletonTabs({ count }: { count: number }) {
  return (
    <div
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-secondary p-1"
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="py-1.5 text-center text-sm">
          <Skeleton className="w-20 bg-card" />
        </span>
      ))}
    </div>
  )
}
