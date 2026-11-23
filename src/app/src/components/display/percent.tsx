import { ThinGap } from '#/components/display/thin-gap'
import { percentFormat } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'

/**
 * A percentage given as a fraction digit string of percent points, such as "7.5". Whole
 * from 1 up; below, one decimal, so a small share does not read as 0 (author, 2026-11-23).
 */
export function Percent({ points }: { points: string }) {
  const locale = useLocale()
  const value = Number(points)
  const parts = percentFormat(
    locale,
    Math.abs(value) < 1 ? 1 : 0,
  ).formatToParts(value / 100)
  return parts.map((part, i) =>
    part.type === 'literal' && parts[i + 1]?.type === 'percentSign' ? (
      <ThinGap key={i} />
    ) : (
      part.value
    ),
  )
}
