/** A phone or tablet: the screen is the pointer, and an open field means an open keyboard. */
export function isTouchDevice() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches
  )
}
