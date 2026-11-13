import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Spinner } from '#/components/feedback/spinner'
import { ListPage } from '#/components/layout/list-page'
import { pageColumn } from '#/components/styles'

function LoadingContent() {
  const { t } = useTranslation()
  return (
    <Spinner label={t('common.loading')} className="mx-auto my-16 size-6" />
  )
}

/** A page whose whole content comes from its loader: only the spinner, under the nav. */
export function PagePending() {
  return (
    <div className={pageColumn}>
      <LoadingContent />
    </div>
  )
}

/**
 * Route options for a list page with a loader: the page changes at the click with its
 * title (and back link), and only what comes from the data loads. Not a router default:
 * the root's session check would then blank the whole app.
 */
export function listPagePending(
  title: (t: TFunction) => string,
  frame: { back?: React.ReactNode; wide?: boolean } = {},
) {
  function ListPagePending() {
    const { t } = useTranslation()
    return (
      <ListPage title={title(t)} back={frame.back} wide={frame.wide}>
        <LoadingContent />
      </ListPage>
    )
  }
  return {
    pendingComponent: ListPagePending,
    pendingMs: 0,
    pendingMinMs: 0,
  } as const
}
