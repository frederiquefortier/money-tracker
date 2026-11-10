import { useTranslation } from 'react-i18next'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'

export function ArchivedOn({ date }: { date: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <span className="text-sm whitespace-nowrap">
      {t('people.archivedOn', { date: formatDate(date, locale, 'medium') })}
    </span>
  )
}
