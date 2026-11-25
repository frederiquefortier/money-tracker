import { useTranslation } from 'react-i18next'
import { Spinner } from '#/components/feedback/spinner'

/**
 * The mark at the end of a list that has more to show: it triggers the next rows when it
 * nears the screen, and shows them loading (a spinner, or the list's own `placeholder`),
 * so reaching it never shows a blank end.
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
      className="flex justify-center py-4 text-muted-foreground"
    >
      <Spinner label={t('common.loading')} />
    </Tag>
  )
}
