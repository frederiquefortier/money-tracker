// A range of whole days as the date range field holds it: ISO `YYYY-MM-DD`, both ends
// included, one day being the same day twice (spec 22, ADR-027).

export type DateRange = { start: string; end: string }

/** Stored as a start and an optional end; no start means no dates. */
export function toRange(
  startsOn: string | null,
  endsOn: string | null,
): DateRange | null {
  return startsOn ? { start: startsOn, end: endsOn ?? startsOn } : null
}

/** The same day twice is one day: no end is stored. */
export function fromRange(range: DateRange | null): {
  startsOn: string | null
  endsOn: string | null
} {
  if (!range) return { startsOn: null, endsOn: null }
  return {
    startsOn: range.start,
    endsOn: range.end === range.start ? null : range.end,
  }
}
