import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { SkeletonRows } from '#/components/feedback/skeleton'
import { ListPage } from '#/components/layout/list-page'

/**
 * Route options for a page with a loader: the page changes at the click with its title
 * (and back link), and only what comes from the data loads, as a skeleton of it (`body`,
 * list rows by default). Not a router default: the root's session check would then blank
 * the whole app.
 */
export function listPagePending(
  title: (t: TFunction) => string,
  frame: {
    back?: React.ReactNode
    wide?: boolean | 'xl'
    body?: React.ComponentType
  } = {},
) {
  const Body = frame.body ?? SkeletonRows
  function ListPagePending() {
    const { t } = useTranslation()
    return (
      <ListPage title={title(t)} back={frame.back} wide={frame.wide}>
        <Body />
      </ListPage>
    )
  }
  return {
    pendingComponent: ListPagePending,
    pendingMs: 0,
    pendingMinMs: 0,
  } as const
}
