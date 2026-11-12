import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

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
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="relative">
      <Icon
        name="search"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={input}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoFocus={autoFocus}
        placeholder={text}
        aria-label={text}
        // The native cancel button differs per browser; the one below is the same everywhere.
        className="pr-9 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value !== '' && (
        <button
          type="button"
          // Keep the focus in the field, and the keyboard open on a phone.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onChange('')
            input.current?.focus()
          }}
          aria-label={t('common.clear')}
          title={t('common.clear')}
          className={cn(
            'absolute top-1/2 right-2 -translate-y-1/2 rounded-field p-1 text-muted-foreground hover:text-foreground',
            focusRing,
          )}
        >
          <Icon name="close" className="size-4" />
        </button>
      )}
    </div>
  )
}
