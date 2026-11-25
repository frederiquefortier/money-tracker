import {
  SkeletonListPage,
  SkeletonNameRow,
} from '#/components/feedback/skeleton'

/** Proches while it loads: the search, the two tabs, then rows with an avatar. */
export function PeopleSkeleton() {
  return (
    <SkeletonListPage
      search
      tabs={2}
      row={(i) => <SkeletonNameRow key={i} i={i} lead="size-11" />}
    />
  )
}
