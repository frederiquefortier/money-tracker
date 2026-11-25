import { Skeleton, SkeletonListPage } from '#/components/feedback/skeleton'
import { KINDS } from '#/lib/categories/category'
import { indentOf } from '#/components/categories/list/category-row'

/** Catégories while it loads: the search, a tab per kind, then rows as `CategoryRow`. */
export function CategoriesSkeleton() {
  return (
    <SkeletonListPage
      search
      tabs={KINDS.length}
      count={8}
      row={(i) => (
        <li
          key={i}
          className="flex items-center gap-1.5 py-2.5 pr-2"
          style={{ paddingLeft: indentOf(0) }}
        >
          <span className="w-5 shrink-0" />
          <span className="flex items-center gap-3">
            <Skeleton className="size-9 flex-none rounded-full" />
            <Skeleton className={i % 2 ? 'w-24' : 'w-32'} />
          </span>
        </li>
      )}
    />
  )
}
