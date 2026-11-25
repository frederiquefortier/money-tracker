import { useTranslation } from 'react-i18next'
import { Skeleton } from '#/components/feedback/skeleton'
import { ListCard } from '#/components/lists/list-card'

const DAY_ROWS = [3, 2, 4]

function RowSkeleton({ long }: { long: boolean }) {
  return (
    <li className="flex items-center gap-3 py-3 pr-6 pl-4">
      <Skeleton className="size-11 flex-none rounded-full" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <Skeleton className={long ? 'w-40' : 'w-28'} />
        <Skeleton className="w-24 text-sm" />
      </span>
      <Skeleton className="w-20 text-lg md:mr-4" />
    </li>
  )
}

/** Days of transactions while they load, at the size of `TransactionDayGroup`'s. */
export function TransactionDaysSkeleton({ days = 3 }: { days?: number }) {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-label={t('common.loading')}
    >
      {Array.from({ length: days }, (_day, d) => (
        <section key={d} className="flex flex-col gap-2" aria-hidden>
          <div className="flex items-center justify-between px-1">
            <Skeleton className="w-28 text-sm" />
            <Skeleton className="w-14 text-sm" />
          </div>
          <ListCard>
            {Array.from(
              { length: DAY_ROWS[d % DAY_ROWS.length] },
              (_row, r) => (
                <RowSkeleton key={r} long={(d + r) % 2 === 0} />
              ),
            )}
          </ListCard>
        </section>
      ))}
    </div>
  )
}
