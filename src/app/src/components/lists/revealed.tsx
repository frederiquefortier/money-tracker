import { useRevealed } from '#/hooks/app/use-revealed'
import { ListEnd } from '#/components/lists/list-end'

/**
 * Renders `items` as they near the screen (useRevealed), then the list's end: an `li`
 * inside a list, a `div` elsewhere. Any list that grows with the user's data goes
 * through it, so a larger account than ours stays fast.
 */
export function Revealed<T>({
  items,
  step,
  as = 'li',
  children,
}: {
  items: ReadonlyArray<T>
  step?: number
  as?: 'li' | 'div'
  children: (shown: ReadonlyArray<T>) => React.ReactNode
}) {
  const { shown, more, sentinel } = useRevealed<T, HTMLElement>(items, step)
  return (
    <>
      {children(shown)}
      {more && <ListEnd sentinel={sentinel} as={as} />}
    </>
  )
}
