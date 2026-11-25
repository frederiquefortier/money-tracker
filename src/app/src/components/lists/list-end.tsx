import { useTranslation } from 'react-i18next'
import { Skeleton } from '#/components/feedback/skeleton'

/**
 * The mark at the end of a list that has more to show: it triggers the next rows when it
 * nears the screen, and shows them loading (a skeleton row, or the list's own
 * `placeholder`), so reaching it never shows a blank end.
 */
export function ListEnd({
  sentinel,
  as: Tag = 'div',
  placeholder,
}: {
  sentinel: (el: HTMLElement | null) => void
  as?: 'li' | 'div'
  placeholder?: React.ReactNode
}) {
  const { t } = useTranslation()
  if (placeholder) return <Tag ref={sentinel}>{placeholder}</Tag>
  return (
    <Tag
      ref={sentinel}
      role="status"
      aria-label={t('common.loading')}
      className="flex min-h-12 items-center gap-3 px-4"
    >
      <Skeleton className="w-36" />
      <span className="flex-1" />
      <Skeleton className="w-20" />
    </Tag>
  )
}
