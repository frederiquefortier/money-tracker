import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ListQuery,
  TransactionPage,
} from '#/lib/transactions/transaction-list'
import { listTransactions } from '#/server/transaction-list'
import { useToast } from '#/hooks/app/use-toast'

/**
 * The loader's first page, then older ones fetched as the end of the list comes into
 * view (spec 14). A new first page (a save, another period) starts over.
 */
export function useTransactionPages(first: TransactionPage, query: ListQuery) {
  const { t } = useTranslation()
  const toast = useToast()
  const [state, setState] = useState({
    first,
    older: [] as Array<TransactionPage>,
  })
  const [loading, setLoading] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  if (state.first !== first) setState({ first, older: [] })

  const pages = state.first === first ? [first, ...state.older] : [first]
  const cursor = pages.at(-1)?.cursor ?? null
  const {
    from,
    to,
    accountIds,
    categoryIds,
    merchantIds,
    personIds,
    search,
    pendingOnly,
    owedOnly,
  } = query

  useEffect(() => {
    const target = sentinel.current
    if (!target || cursor === null || loading) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      setLoading(true)
      listTransactions({
        data: {
          from,
          to,
          accountIds,
          categoryIds,
          merchantIds,
          personIds,
          search,
          pendingOnly,
          owedOnly,
          before: cursor,
        },
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
  }, [
    cursor,
    loading,
    first,
    from,
    to,
    accountIds,
    categoryIds,
    merchantIds,
    personIds,
    search,
    pendingOnly,
    owedOnly,
    toast,
    t,
  ])

  return {
    days: pages.flatMap((p) => p.days),
    more: cursor !== null,
    loading,
    sentinel,
  }
}
