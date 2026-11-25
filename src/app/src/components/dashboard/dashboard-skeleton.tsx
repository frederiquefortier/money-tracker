import { useTranslation } from 'react-i18next'
import { SkeletonCard } from '#/components/feedback/skeleton'

/** The dashboard's cards while its history loads, in `MoneyOverview`'s grid. */
export function DashboardSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="grid gap-4 xl:grid-cols-2"
      role="status"
      aria-label={t('common.loading')}
    >
      <SkeletonCard chart="h-24" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard chart="h-32" />
      <div className="xl:col-span-2">
        <SkeletonCard chart="h-80" />
      </div>
    </div>
  )
}
