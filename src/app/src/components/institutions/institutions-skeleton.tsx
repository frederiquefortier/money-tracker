import {
  SkeletonListPage,
  SkeletonNameRow,
} from '#/components/feedback/skeleton'

/** Institutions while it loads: rows of a name over what uses it. */
export function InstitutionsSkeleton() {
  return <SkeletonListPage row={(i) => <SkeletonNameRow key={i} i={i} />} />
}
