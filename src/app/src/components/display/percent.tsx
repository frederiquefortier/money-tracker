import { ThinGap } from '#/components/display/thin-gap'
import { percentFormat } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'

/** A percentage given as a fraction digit string of percent points, such as "7.5". */
export function Percent({
  points,
  digits = 1,
}: {
  points: string
  digits?: number
}) {
  const locale = useLocale()
  const parts = percentFormat(locale, digits).formatToParts(
    Number(points) / 100,
  )
  return parts.map((part, i) =>
    part.type === 'literal' && parts[i + 1]?.type === 'percentSign' ? (
      <ThinGap key={i} />
    ) : (
      part.value
    ),
  )
}
