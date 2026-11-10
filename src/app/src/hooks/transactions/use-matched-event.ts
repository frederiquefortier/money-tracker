import { useEffect } from 'react'
import { getMatchingEvent } from '#/server/events'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'

/**
 * Spec 22: until the event is chosen or cleared by hand, the field follows the rule as
 * the date and the kind change. The rule itself stays in SQL, so what shows here is what
 * saving will give. A failed lookup leaves the field as it was.
 */
export function useMatchedEvent(
  draft: TransactionDraft,
  id: string | undefined,
  setEvent: (eventId: string | null) => void,
) {
  const { occurredOn, kind, eventChoice } = draft
  useEffect(() => {
    if (eventChoice !== 'auto') return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) return setEvent(null)
    let current = true
    const timer = setTimeout(() => {
      getMatchingEvent({ data: { occurredOn, kind, transactionId: id } })
        .then((matched) => current && setEvent(matched))
        .catch(() => {})
    }, 250)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [eventChoice, occurredOn, kind, id])
}
