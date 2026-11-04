import { useTranslation } from 'react-i18next'
import { Input } from '#/components/ui/input'

/** The one search field: "Rechercher", whatever the list. */
export function SearchField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={t('common.search')}
      aria-label={t('common.search')}
    />
  )
}
