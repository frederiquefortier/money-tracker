import { useState } from 'react'
import { idSet } from '#/lib/shared/collections'
import { setCollapsedGroups } from '#/server/net-worth'

// One save at a time, so quick toggles reach the cookie in order.
let saving: Promise<unknown> = Promise.resolve()

/**
 * The hub's folded groups. `saved` comes from the cookie with the page's data, so the
 * server renders them folded; a toggle shows at once and the cookie follows. A failed
 * save keeps the choice for this visit only.
 */
export function useCollapsedGroups(saved: ReadonlyArray<string>) {
  const [list, setList] = useState<ReadonlyArray<string>>(saved)
  return idSet(list, (next) => {
    setList(next)
    saving = saving
      .then(() => setCollapsedGroups({ data: { keys: next } }))
      .catch(() => {})
  })
}
