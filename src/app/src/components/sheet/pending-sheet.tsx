import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner } from '#/components/feedback/spinner'
import { Sheet, SheetBody, SheetContent } from '#/components/ui/sheet'

// A sheet route used to show nothing until its loader answered. This sheet slides in at
// the tap while it loads; the real sheet then takes over where the slide is, so it does
// not slide in twice. Only one sheet loads at a time, so one start time is enough.
const SLIDE_MS = 300
let slideStartedAt: number | null = null

/** Where a sheet taking over starts its slide: a negative delay, 0 when none was loading. */
export function takeOverDelay(): number {
  if (slideStartedAt === null) return 0
  return Math.max(slideStartedAt - performance.now(), -SLIDE_MS)
}

/** The pendingComponent of a sheet route with a loader. It cannot be closed while it loads. */
export function PendingSheet() {
  const { t } = useTranslation()
  // A loading sheet that follows another (the form's data, then the transaction) goes on
  // with the same slide.
  const [startedAt] = useState(() => slideStartedAt ?? performance.now())
  const [enterDelay] = useState(takeOverDelay)
  useEffect(() => {
    slideStartedAt = startedAt
    return () => {
      slideStartedAt = null
    }
  }, [startedAt])

  return (
    <Sheet open>
      <SheetContent
        title={t('common.loading')}
        closeLabel={t('common.close')}
        enterDelay={enterDelay}
      >
        <SheetBody>
          <Spinner
            label={t('common.loading')}
            className="mx-auto my-8 size-6"
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

/** Route options for a sheet with a loader: the loading sheet at once, the real one as soon as ready. */
export const SHEET_PENDING = {
  pendingComponent: PendingSheet,
  pendingMs: 0,
  pendingMinMs: 0,
} as const
