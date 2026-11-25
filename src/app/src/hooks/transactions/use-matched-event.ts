import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMatchingEvent } from '#/server/events'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'

type Lookup = {
  occurredOn: string
  kind: TransactionDraft['kind']
  transactionId: string | undefined
  categoryIds: Array<string>
}

/** The lookup to send, once the fields have rested 250 ms. */
function useSettled(lookup: Lookup | null): Lookup | null {
  const key = JSON.stringify(lookup)
  const [settled, setSettled] = useState(lookup)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(lookup), 250)
    return () => clearTimeout(timer)
  }, [key])
  return settled
}

/**
 * until the event is chosen or cleared by hand, the field follows the rule as
 * the date and the kind change. The rule itself stays in SQL, so what shows here is what
 * saving will give. A failed lookup leaves the field as it was.
 */
export function useMatchedEvent(
  draft: TransactionDraft,
  id: string | undefined,
  setEvent: (eventId: string | null) => void,
) {
  const { occurredOn, kind, eventChoice } = draft
  const auto = eventChoice === 'auto'
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(occurredOn)
  // The categories decide too (Sauf): one field, or the split lines.
  const categoryIds = (
    draft.splitMode ? draft.lines.map((l) => l.categoryId) : [draft.categoryId]
  ).filter((c): c is string => c !== null)
  const lookup = useSettled(
    auto && validDate
      ? { occurredOn, kind, transactionId: id, categoryIds }
      : null,
  )
  const { data } = useQuery({
    queryKey: ['matched-event', lookup],
    queryFn: () => getMatchingEvent({ data: lookup as Lookup }),
    enabled: lookup !== null,
  })

  useEffect(() => {
    if (auto && !validDate) setEvent(null)
  }, [auto, validDate])
  useEffect(() => {
    if (auto && lookup && data !== undefined) setEvent(data)
  }, [auto, lookup, data])
}
