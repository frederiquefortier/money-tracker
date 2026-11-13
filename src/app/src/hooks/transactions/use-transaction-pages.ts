import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ListQuery,
  TransactionPage,
} from '#/lib/transactions/transaction-list'
import { listTransactions } from '#/server/transaction-list'
import { useToast } from '#/hooks/app/use-toast'

/**
 * The loader's first page, then older ones fetched as the end of the list comes into
 * view. A new first page (a save, another period) starts over.
 */
export function useTransactionPages(first: TransactionPage, query: ListQuery) {
  const { t } = useTranslation()
  const toast = useToast()
  const [state, setState] = useState({
    first,
    older: [] as Array<TransactionPage>,
  })
  const [loading, setLoading] = useState(false)
  // A callback ref: the sentinel can appear after the first render (once every day shows).
  const [target, sentinel] = useState<HTMLDivElement | null>(null)
  if (state.first !== first) setState({ first, older: [] })

  const pages = state.first === first ? [first, ...state.older] : [first]
  const cursor = pages.at(-1)?.cursor ?? null
  useEffect(() => {
    if (!target || cursor === null || loading) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      setLoading(true)
      listTransactions({
        data: { ...query, before: cursor },
      })
        .then((page) =>
          setState((s) =>
            s.first === first ? { first, older: [...s.older, page] } : s,
          ),
        )
        .catch(() => toast({ text: t('common.genericError') }))
        .finally(() => setLoading(false))
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [target, cursor, loading, first, query, toast, t])

  return {
    days: pages.flatMap((p) => p.days),
    more: cursor !== null,
    loading,
    sentinel,
  }
}
