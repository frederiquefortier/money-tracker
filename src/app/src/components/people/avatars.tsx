import { Icon } from '#/components/display/icon'
import { initialOf } from '#/lib/people/person'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'
import { stackRing } from '#/components/styles'

const SIZES = {
  sm: 'size-6 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-11 text-lg',
} as const

/** For now a person's icon is the first letter of their name. */
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

/**
 * People without a name (PPL-04): the person icon, or a group's icon when there are
 * several of them.
 */
export function AnonymousAvatar({
  count,
  size = 'lg',
  className,
}: {
  count: number
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full border border-dashed border-primary/40 bg-card text-primary',
        SIZES[size],
        '[&_svg]:size-[60%]',
        className,
      )}
    >
      <Icon name={count > 1 ? 'users' : 'user'} />
    </span>
  )
}

/** One avatar of a stack: a person by name, or people without a name and how many. */
export type StackItem = { name: string | null; count: number }

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
  return (
    <AvatarStack
      items={names.map((name) => ({ name, count: 1 }))}
      size={size}
    />
  )
}

/**
 * Avatars overlapping, as a group's icon or the people on a transaction's row,
 * a line without a name as its icon.
 */
export function AvatarStack({
  items,
  size = 'lg',
}: {
  items: ReadonlyArray<StackItem>
  size?: 'md' | 'lg'
}) {
  const names = items
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
      {shown.map((item, i) => {
        const className = cn(stackRing, i > 0 && (small ? '-ml-2' : '-ml-2.5'))
        return item.name === null ? (
          <AnonymousAvatar
            key={`anonymous-${i}`}
            count={item.count}
            size={small ? 'sm' : 'md'}
            className={className}
          />
        ) : (
          <PersonAvatar
            key={`${item.name}-${i}`}
            name={item.name}
            size={small ? 'sm' : 'md'}
            className={className}
          />
        )
      })}
      {more > 0 && (
        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-full bg-muted font-bold text-muted-foreground',
            stackRing,
            small ? '-ml-2 size-6 text-[0.6rem]' : '-ml-2.5 size-8 text-xs',
          )}
        >
          +{more}
        </span>
      )}
    </span>
  )
}
