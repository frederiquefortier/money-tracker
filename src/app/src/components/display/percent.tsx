import { ThinGap } from '#/components/display/thin-gap'
import { hiddenPercentParts, percentFormat } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { usePrivacy } from '#/hooks/app/use-privacy'

/**
 * A percentage given as a fraction digit string of percent points, such as "7.5". Whole
 * from 1 up; below, one decimal, so a small share does not read as 0.
 * Bullets in privacy mode (SET-08).
 */
export function Percent({ points }: { points: string }) {
  const locale = useLocale()
  const value = Number(points)
  const { figuresHidden } = usePrivacy()
  const shown = percentFormat(
    locale,
    Math.abs(value) < 1 ? 1 : 0,
  ).formatToParts(value / 100)
  const parts = figuresHidden ? hiddenPercentParts(locale) : shown
  return parts.map((part, i) =>
    part.type === 'literal' && parts[i + 1]?.type === 'percentSign' ? (
      <ThinGap key={i} />
    ) : (
      part.value
    ),
  )
}
