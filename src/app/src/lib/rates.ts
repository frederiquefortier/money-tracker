// Exchange-rate providers (ADR-009). Rates are kept as the decimal strings the providers
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

const FRANKFURTER = 'https://api.frankfurter.dev/v1'
const HEXARATE = 'https://hexarate.paikama.co/api/rates/latest'
const TIMEOUT_MS = 8000

/** EUR-based rates for every published day from `from` to today. */
export async function fetchFrankfurter(from: string): Promise<unknown> {
  const response = await fetch(`${FRANKFURTER}/${from}..`, {
    signal: AbortSignal.timeout(TIMEOUT_MS * 2),
  })
  // A start date after the last published day answers 404: nothing new yet.
  if (response.status === 404) return { rates: {} }
  if (!response.ok) throw new Error(`Frankfurter answered ${response.status}`)
  return response.json()
}

/** Keeps the days from `from` on (the API adds the day before) and known currencies. */
export function frankfurterRows(
  body: unknown,
  from: string,
  known: ReadonlySet<string>,
): Array<RateRow> {
  const rates = (body as { rates?: Record<string, Record<string, unknown>> })
    .rates
  if (!rates || typeof rates !== 'object') return []
  return Object.entries(rates).flatMap(([date, quotes]) =>
    date < from
      ? []
      : Object.entries(quotes).flatMap(([quote, rate]) =>
          known.has(quote) && quote !== 'EUR' && isPositiveDecimal(rate)
            ? [
                {
                  quote,
                  rate_date: date,
                  rate: String(rate),
                  source: 'frankfurter' as const,
                },
              ]
            : [],
        ),
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
