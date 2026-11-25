import { Skeleton, SkeletonListPage } from '#/components/feedback/skeleton'

/** Devises while it loads: the code and name, then the two actions, as `CurrencyRow`. */
export function CurrenciesSkeleton() {
  return (
    <SkeletonListPage
      count={3}
      row={(i) => (
        <li key={i} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
          <span className="w-9 shrink-0 font-bold">
            <Skeleton className="w-9" />
          </span>
          <span className="flex-1">
            <Skeleton className={i % 2 ? 'w-28' : 'w-40'} />
          </span>
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </li>
      )}
    />
  )
}
