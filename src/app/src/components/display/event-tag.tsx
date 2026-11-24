import { useTranslation } from 'react-i18next'
import { Sparkle } from '#/components/display/sparkle'
import { tagTint, tagTintStyle } from '#/components/styles'
import { cn } from '#/lib/utils'

/**
 * An event as a soft pill: its type's colour, tinted like a Gmail label;
 * neutral when it has no type. The sparkle marks a link made by the rule rather than by
 * hand.
 */
export function EventTag({
  name,
  color,
  auto = false,
  className,
}: {
  name: string
  color: string | null
  auto?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        color ? tagTint : 'bg-secondary text-primary',
        className,
      )}
      style={tagTintStyle(color)}
    >
      <span className="truncate">{name}</span>
      {auto && (
        <>
          <Sparkle className="size-2.5 shrink-0" />
          <span className="sr-only">{t('events.auto')}</span>
        </>
      )}
    </span>
  )
}
