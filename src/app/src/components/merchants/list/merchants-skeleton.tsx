import {
  SkeletonListPage,
  SkeletonNameRow,
} from '#/components/feedback/skeleton'

/** Marchands while it loads: the search, then rows with the category's badge. */
export function MerchantsSkeleton() {
  return (
    <SkeletonListPage
      search
      row={(i) => <SkeletonNameRow key={i} i={i} lead="size-11" />}
    />
  )
}
