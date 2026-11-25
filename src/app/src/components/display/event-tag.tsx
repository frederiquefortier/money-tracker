import { useTranslation } from 'react-i18next'
import { Sparkle } from '#/components/display/sparkle'
import { tagColors } from '#/lib/shared/color'
import { cn } from '#/lib/utils'

// Readable on any hex: the classes, and the style that sets their colours from the type's.
const TAG_TINT =
  'bg-(--tag-bg) text-(--tag-text) dark:bg-(--tag-bg-dark) dark:text-(--tag-text-dark)'

function tintStyle(color: string | null): React.CSSProperties | undefined {
  if (!color) return undefined
  const colors = tagColors(color)
  return {
    '--tag-bg': colors.light.background,
    '--tag-text': colors.light.text,
    '--tag-bg-dark': colors.dark.background,
    '--tag-text-dark': colors.dark.text,
  } as React.CSSProperties
}

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
        color ? TAG_TINT : 'bg-secondary text-primary',
        className,
      )}
      style={tintStyle(color)}
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
