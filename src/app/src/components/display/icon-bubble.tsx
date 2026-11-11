import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { errorTint } from '#/components/styles'
import { cn } from '#/lib/utils'

const TONES = {
  neutral: 'bg-secondary text-secondary-foreground',
  primary: 'bg-secondary text-primary',
  income: 'bg-income/10 text-income',
  error: errorTint,
}

const SIZES = {
  sm: 'size-8 [&_svg]:size-4',
  md: 'size-11 [&_svg]:size-6',
  lg: 'size-14 [&_svg]:size-8',
}

/**
 * An icon in a round tinted badge: a transfer or adjustment in the list, the kind of
 * file in the import, the icon of an empty or finished screen.
 */
export function IconBubble({
  icon,
  tone = 'neutral',
  size = 'md',
  className,
}: {
  icon: IconName
  tone?: keyof typeof TONES
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full',
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      <Icon name={icon} />
    </span>
  )
}
