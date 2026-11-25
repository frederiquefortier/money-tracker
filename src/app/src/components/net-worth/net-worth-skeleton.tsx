import { SkeletonCard, SkeletonRows } from '#/components/feedback/skeleton'

/** The hub while it loads: the chart's card, then the list, in `NetWorthDashboard`'s grid. */
export function NetWorthSkeleton() {
  return (
    <div className="flex flex-col gap-3 xl:grid xl:grid-cols-12 xl:items-start">
      <div className="min-w-0 xl:col-span-6">
        <SkeletonCard chart="h-80" />
      </div>
      <div className="min-w-0 xl:col-span-6 xl:col-start-7">
        <SkeletonRows count={6} />
      </div>
    </div>
  )
}
