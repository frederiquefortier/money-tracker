import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TransactionPage } from '#/lib/transactions/transaction-list'
import { queryKey } from '#/lib/transactions/transaction-search'
import type { Query } from '#/lib/transactions/transaction-search'
import { listTransactions } from '#/server/transaction-list'
import { useToast } from '#/hooks/app/use-toast'

type Pages = {
  first: TransactionPage
  key: string
  older: Array<TransactionPage>
  /** After a save, the oldest day that was loaded: older pages reload down to it. */
  depth: string | null
}

const oldestDay = (pages: ReadonlyArray<TransactionPage>) =>
  pages.at(-1)?.days.at(-1)?.date ?? null

/** The older pages still shown under a new first page, without the days it now holds. */
function keptUnder(
  older: ReadonlyArray<TransactionPage>,
  cursor: string | null,
): Array<TransactionPage> {
  if (cursor === null) return []
  return older.map((page) => ({
    ...page,
    days: page.days.filter((day) => day.date < cursor),
  }))
}

/** The pages before `cursor`, one after the other, until `depth` is reached. */
async function pagesDownTo(
  query: Query,
  cursor: string | null,
  depth: string,
): Promise<Array<TransactionPage>> {
  const pages: Array<TransactionPage> = []
  let before = cursor
  while (before !== null && before > depth) {
    const page = await listTransactions({ data: { ...query, before } })
    pages.push(page)
    before = page.cursor
  }
  return pages
}

/**
 * The loader's first page, then older ones fetched as the end of the list comes into
 * view. Another period, filter or search starts over. A save reloads the first page
 * only, so the older ones stay on screen and reload down to the same day, keeping the
 * scroll where it was.
 */
export function useTransactionPages(first: TransactionPage, query: Query) {
  const { t } = useTranslation()
  const toast = useToast()
  const key = queryKey(query)
  const [state, setState] = useState<Pages>({
    first,
    key,
    older: [],
    depth: null,
  })
  const [loading, setLoading] = useState(false)
  // A callback ref: the sentinel can appear after the first render (once every day shows).
  const [target, sentinel] = useState<HTMLElement | null>(null)
  if (state.first !== first) {
    // A second save while the pages reload keeps the depth the first one asked for.
    const depth =
      key === state.key ? (state.depth ?? oldestDay(state.older)) : null
    setState({
      first,
      key,
      older: depth ? keptUnder(state.older, first.cursor) : [],
      depth,
    })
  }

  const current = state.first === first
  const pages = current ? [first, ...state.older] : [first]
  const cursor = pages.at(-1)?.cursor ?? null
  const refreshing = current && state.depth !== null

  useEffect(() => {
    const { depth } = state
    if (state.first !== first || depth === null) return
    let stale = false
    pagesDownTo(query, first.cursor, depth)
      .then((older) => {
        if (!stale)
          setState((s) =>
            s.first === first ? { ...s, older, depth: null } : s,
          )
      })
      .catch(() => toast({ text: t('common.genericError') }))
    return () => {
      stale = true
    }
  }, [state, first, query, toast, t])

  useEffect(() => {
    if (!target || cursor === null || loading || refreshing) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      setLoading(true)
      listTransactions({
        data: { ...query, before: cursor },
      })
        .then((page) =>
          setState((s) =>
            s.first === first ? { ...s, older: [...s.older, page] } : s,
          ),
        )
        .catch(() => toast({ text: t('common.genericError') }))
        .finally(() => setLoading(false))
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [target, cursor, loading, refreshing, first, query, toast, t])

  return {
    days: pages.flatMap((p) => p.days),
    more: cursor !== null,
    sentinel,
  }
}
