import {
  SkeletonListPage,
  SkeletonNameRow,
} from '#/components/feedback/skeleton'

/** Événements while it loads: the search, the two tabs, then rows with the type's dot. */
export function EventsSkeleton() {
  return (
    <SkeletonListPage
      search
      tabs={2}
      row={(i) => <SkeletonNameRow key={i} i={i} lead="size-6" />}
    />
  )
}
