import { useTranslation } from 'react-i18next'
import { Skeleton, SkeletonTabs } from '#/components/feedback/skeleton'
import { cardSurface } from '#/components/styles'
import { cn } from '#/lib/utils'
import { IMPORT_STEPS } from '#/lib/import/import-stage'

/** Données while it loads: the two tabs, the steps, then the files card with its drop area. */
export function ImportSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-label={t('common.loading')}
    >
      <SkeletonTabs count={2} />
      <div
        className="mx-auto flex w-full max-w-md items-start py-2"
        aria-hidden
      >
        {IMPORT_STEPS.map((step, i) => (
          <div key={step} className="contents">
            <span className="flex w-24 shrink-0 flex-col items-center gap-1.5">
              <Skeleton className="size-10 rounded-full" />
              <span className="text-xs">
                <Skeleton className="w-12" />
              </span>
              <span>
                <Skeleton className="w-16" />
              </span>
            </span>
            {i < IMPORT_STEPS.length - 1 && (
              <span className="mt-5 h-0.5 flex-1 rounded-full bg-border" />
            )}
          </div>
        ))}
      </div>
      <div className={cn(cardSurface, 'flex flex-col')} aria-hidden>
        <div className="p-4">
          <Skeleton className="block h-44 w-full rounded-field" />
        </div>
        <div className="flex justify-end border-t p-4">
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
