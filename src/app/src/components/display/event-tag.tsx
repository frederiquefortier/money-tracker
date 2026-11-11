import { useTranslation } from 'react-i18next'
import { Sparkle } from '#/components/display/sparkle'
import { tagColors } from '#/lib/shared/color'
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
  const colors = color ? tagColors(color) : null
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        colors
          ? 'bg-(--tag-bg) text-(--tag-text) dark:bg-(--tag-bg-dark) dark:text-(--tag-text-dark)'
          : 'bg-secondary text-primary',
        className,
      )}
      style={
        colors
          ? ({
              '--tag-bg': colors.light.background,
              '--tag-text': colors.light.text,
              '--tag-bg-dark': colors.dark.background,
              '--tag-text-dark': colors.dark.text,
            } as React.CSSProperties)
          : undefined
      }
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
