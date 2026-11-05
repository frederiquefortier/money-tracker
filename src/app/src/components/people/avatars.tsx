import { initialOf } from '#/lib/people'
import { useFormatLocale } from '#/lib/use-locale'
import { cn } from '#/lib/utils'

const SIZES = {
  sm: 'size-6 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-11 text-lg',
} as const

/** For now a person's icon is the first letter of their name (spec 19). */
export function PersonAvatar({
  name,
  size = 'lg',
  className,
}: {
  name: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const locale = useFormatLocale()
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-secondary font-bold text-primary',
        SIZES[size],
        className,
      )}
    >
      {initialOf(name, locale)}
    </span>
  )
}

// Three avatars fit the slot; past that, two and the count of the others.
const SHOWN = 3

/**
 * A group's icon: its members' avatars, overlapping, in a slot of fixed width so the
 * names line up. With no member, an empty circle.
 */
export function GroupAvatars({
  names,
  size = 'lg',
}: {
  names: ReadonlyArray<string>
  /** The height of the person avatars it sits beside: a list row's, or a check row's. */
  size?: 'md' | 'lg'
}) {
  const small = size === 'md'
  const shown =
    names.length > SHOWN ? names.slice(0, SHOWN - 1) : names.slice(0, SHOWN)
  const more = names.length - shown.length
  return (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center', small ? 'w-14' : 'w-19')}
    >
      {names.length === 0 && (
        <span
          className={cn(
            'shrink-0 rounded-full border border-dashed',
            small ? 'size-8' : 'size-11',
          )}
        />
      )}
      {shown.map((name, i) => (
        <PersonAvatar
          key={`${name}-${i}`}
          name={name}
          size={small ? 'sm' : 'md'}
          className={cn(
            'ring-2 ring-card',
            i > 0 && (small ? '-ml-2' : '-ml-2.5'),
          )}
        />
      ))}
      {more > 0 && (
        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-full bg-muted font-bold text-muted-foreground ring-2 ring-card',
            small ? '-ml-2 size-6 text-[0.6rem]' : '-ml-2.5 size-8 text-xs',
          )}
        >
          +{more}
        </span>
      )}
    </span>
  )
}
