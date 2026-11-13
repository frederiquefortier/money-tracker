import { useState } from 'react'

/**
 * Whether a dialog is in the page: from its first opening until its closing animation
 * ends (call `unmount` then). A closed dialog on each of hundreds of rows cost most of a
 * list's first render.
 */
export function useMountedWhileOpen(open: boolean) {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  return { mounted: mounted || open, unmount: () => setMounted(false) }
}
