// Round steps for a money axis (1, 2, 2.5 or 5 times a power of ten), so it reads
// 0, 2 k, 4 k, 6 k instead of Recharts' 1,5 k steps. Numbers for the drawing only.

const STEPS = [1, 2, 2.5, 5, 10]

/** Ticks from zero (or below it) past the largest value, about `count` steps apart. */
export function axisTicks(
  values: ReadonlyArray<number>,
  count = 4,
): Array<number> {
  const max = Math.max(0, ...values)
  const min = Math.min(0, ...values)
  if (max === min) return [0]
  const raw = (max - min) / count
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = (STEPS.find((s) => s * power >= raw) ?? 10) * power
  const low = Math.floor(min / step)
  const high = Math.ceil(max / step)
  return Array.from({ length: high - low + 1 }, (_, i) => (low + i) * step)
}
