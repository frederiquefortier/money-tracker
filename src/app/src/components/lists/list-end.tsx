import { useTranslation } from 'react-i18next'
import { Spinner } from '#/components/feedback/spinner'

/**
 * The mark at the end of a list that has more to show: it triggers the next rows when it
 * nears the screen, and spins while they come, so reaching it never shows a blank end.
 */
export function ListEnd({
  sentinel,
  as: Tag = 'div',
}: {
  sentinel: (el: HTMLElement | null) => void
  as?: 'li' | 'div'
}) {
  const { t } = useTranslation()
  return (
    <Tag
      ref={sentinel}
      className="flex justify-center py-4 text-muted-foreground"
    >
      <Spinner label={t('common.loading')} />
    </Tag>
  )
}
