import { useEffect, useRef, useState } from 'react'
import type { TransactionsSearch } from '#/lib/transactions/transaction-search'

type Patch = (prev: TransactionsSearch) => TransactionsSearch
type Pending = { search: TransactionsSearch; replace: boolean }

/**
 * The list's address as the page shows it. A filter, period or status shows at once (a
 * chip goes as soon as its ✕ is pressed), and the address follows once the changes pause,
 * so filters set together make one request.
 */
export function useDraftSearch(
  search: TransactionsSearch,
  send: (search: TransactionsSearch, replace: boolean) => void,
) {
  const [draft, setDraft] = useState<TransactionsSearch | null>(null)
  const shown = useRef<TransactionsSearch | null>(null)
  const pending = useRef<Pending | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latest = useRef(send)
  latest.current = send
  // The address moved, to the draft sent or by back or a link: it is what shows again.
  const key = JSON.stringify(search)
  useEffect(() => {
    if (pending.current) return
    shown.current = null
    setDraft(null)
  }, [key])
  useEffect(() => () => clearTimeout(timer.current), [])

  const change = (
    patch: Patch,
    { replace = false, now = false }: { replace?: boolean; now?: boolean } = {},
  ) => {
    const next = patch(shown.current ?? search)
    pending.current = {
      search: next,
      replace: replace && (pending.current?.replace ?? true),
    }
    shown.current = next
    setDraft(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(
      () => {
        const sent = pending.current
        pending.current = null
        if (sent) latest.current(sent.search, sent.replace)
      },
      now ? 0 : 400,
    )
  }
  return [draft ?? search, change] as const
}
