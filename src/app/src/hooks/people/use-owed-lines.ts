import { useQuery } from '@tanstack/react-query'
import { getOwedLines } from '#/server/owed'

/** A person's owed lines (PPL-05, TRX-07), with what `incomeId` pays back on each. */
export function useOwedLines(personId: string | null, incomeId?: string) {
  return useQuery({
    queryKey: ['owed-lines', personId, incomeId ?? null],
    queryFn: () =>
      getOwedLines({ data: { personId: personId ?? '', incomeId } }),
    enabled: personId !== null,
  })
}
