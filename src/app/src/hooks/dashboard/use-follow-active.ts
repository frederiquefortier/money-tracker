import { useEffect } from 'react'

/**
 * Keeps the entry marked `data-entry={active}` in the middle of its scrolling list, by
 * scrolling the list only so the page never moves.
 */
export function useFollowActive(
  list: HTMLElement | null,
  active: string | null,
  axis: 'x' | 'y',
) {
  useEffect(() => {
    if (!list || active === null) return
    const item = list.querySelector<HTMLElement>(`[data-entry="${active}"]`)
    if (!item) return
    if (axis === 'y')
      list.scrollTo({
        top: item.offsetTop - list.clientHeight / 2,
        behavior: 'smooth',
      })
    else
      list.scrollTo({
        left: item.offsetLeft - list.clientWidth / 2,
        behavior: 'smooth',
      })
  }, [list, active, axis])
}
