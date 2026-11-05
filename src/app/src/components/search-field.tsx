import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { Input } from '#/components/ui/input'

/** The one search field: a magnifier and "Rechercher", or what `label` says it looks through. */
export function SearchField({
  value,
  onChange,
  autoFocus,
  label,
}: {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  label?: string
}) {
  const { t } = useTranslation()
  const text = label ?? t('common.search')
  return (
    <div className="relative">
      <Icon
        name="search"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoFocus={autoFocus}
        placeholder={text}
        aria-label={text}
        className="pl-9"
      />
    </div>
  )
}
