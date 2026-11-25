// Exchange-rate providers (ADR-069). Rates are kept as the decimal strings the providers
// send, so no float touches them before Postgres (ADR-004).

export type RateRow = {
  quote: string
  rate_date: string
  rate: string
  source: 'frankfurter' | 'hexarate'
}

export type HexaRateResult =
  | { ok: true; rate: string; date: string }
  | { ok: false; reason: 'unknown' | 'unavailable' }

const FRANKFURTER = 'https://api.frankfurter.dev/v2'
const HEXARATE = 'https://hexarate.paikama.co/api/rates/latest'
const TIMEOUT_MS = 8000

async function getJson(url: string, timeout: number): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout) })
  if (!response.ok) throw new Error(`Frankfurter answered ${response.status}`)
  return response.json()
}

/** The currencies Frankfurter has rates for; an unknown code in a query is refused. */
export async function fetchFrankfurterCodes(): Promise<Set<string>> {
  return frankfurterCodes(
    await getJson(`${FRANKFURTER}/currencies`, TIMEOUT_MS),
  )
}

/** Fiat codes only: the list also holds crypto and metals. */
export function frankfurterCodes(body: unknown): Set<string> {
  if (!Array.isArray(body)) return new Set()
  return new Set(
    body.flatMap((entry: { iso_code?: unknown; type?: unknown }) =>
      entry.type === 'currency' && typeof entry.iso_code === 'string'
        ? [entry.iso_code]
        : [],
    ),
  )
}

/**
 * EUR-based rates for `quotes` from `from` to `to`. A year of every currency is about
 * 4 MB and 25 s, so callers ask for a year at most.
 */
export async function fetchFrankfurter(range: {
  from: string
  to: string
  quotes: ReadonlyArray<string>
}): Promise<unknown> {
  const query = new URLSearchParams({
    base: 'EUR',
    from: range.from,
    to: range.to,
    quotes: range.quotes.join(','),
  })
  return getJson(`${FRANKFURTER}/rates?${query}`, TIMEOUT_MS * 8)
}

/**
 * Keeps the days from `from` on (the API adds the last one before it) and known
 * currencies. Some central banks publish on weekends, so a day may have rows for a few
 * currencies only.
 */
export function frankfurterRows(
  body: unknown,
  from: string,
  known: ReadonlySet<string>,
): Array<RateRow> {
  if (!Array.isArray(body)) return []
  return body.flatMap(
    (entry: {
      date?: unknown
      base?: unknown
      quote?: unknown
      rate?: unknown
    }) =>
      entry.base === 'EUR' &&
      typeof entry.date === 'string' &&
      entry.date >= from &&
      typeof entry.quote === 'string' &&
      known.has(entry.quote) &&
      entry.quote !== 'EUR' &&
      isPositiveDecimal(entry.rate)
        ? [
            {
              quote: entry.quote,
              rate_date: entry.date,
              rate: String(entry.rate),
              source: 'frankfurter' as const,
            },
          ]
        : [],
  )
}

/** One EUR-based rate, today's. Also the CUR-02 check when a currency is added. */
export async function fetchHexaRate(code: string): Promise<HexaRateResult> {
  let response: Response
  try {
    response = await fetch(
      `${HEXARATE}/EUR?target=${encodeURIComponent(code)}`,
      {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    )
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
  if (response.status === 422) return { ok: false, reason: 'unknown' }
  if (!response.ok) return { ok: false, reason: 'unavailable' }
  return parseHexaRate(await response.json().catch(() => null))
}

export function parseHexaRate(body: unknown): HexaRateResult {
  const data = (body as { data?: Record<string, unknown> } | null)?.data
  // unit is the amount of base the mid is quoted for; anything but 1 is not expected.
  if (
    !data ||
    data.unit !== 1 ||
    !isPositiveDecimal(data.mid) ||
    typeof data.timestamp !== 'string'
  ) {
    return { ok: false, reason: 'unavailable' }
  }
  return { ok: true, rate: String(data.mid), date: data.timestamp.slice(0, 10) }
}

function isPositiveDecimal(value: unknown): value is number | string {
  return (
    (typeof value === 'number' || typeof value === 'string') &&
    /^\d+(\.\d+)?$/.test(String(value)) &&
    Number(value) > 0
  )
}
