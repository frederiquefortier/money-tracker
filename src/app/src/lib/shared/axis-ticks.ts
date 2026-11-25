// Round steps for a money axis (1, 2, 2.5 or 5 times a power of ten), so it reads
// 0, 2 k, 4 k, 6 k instead of Recharts' 1,5 k steps. Numbers for the drawing only.

const STEPS = [1, 2, 2.5, 5]

/** The ticks over `min` to `max`, on the smallest round step giving at most `maxLines`. */
export function axisTicks(
  min: number,
  max: number,
  maxLines = 6,
): Array<number> {
  // A flat line gets a band around it, so it sits mid-chart.
  const pad = min === max ? Math.abs(min) / 10 || 1 : 0
  const low = Math.min(min, max) - pad
  const high = Math.max(min, max) + pad
  const count = (step: number) =>
    Math.ceil(high / step) - Math.floor(low / step) + 1
  let step = 1
  for (let power = 1; count(step) > maxLines; power *= 10)
    step =
      STEPS.map((s) => s * power).find((s) => count(s) <= maxLines) ??
      10 * power
  const first = Math.floor(low / step)
  return Array.from(
    { length: Math.ceil(high / step) - first + 1 },
    (_, i) => (first + i) * step,
  )
}
