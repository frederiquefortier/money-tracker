import { cn } from '#/lib/utils'

const WIDTH = 64
const HEIGHT = 20

/**
 * A tiny line of a figure over time, without axes, for a row. Numbers are used for the
 * drawing only; a gap (null) breaks the line. A `className` with a size stretches it.
 */
export function Sparkline({
  values,
  color,
  className,
}: {
  values: ReadonlyArray<number | null>
  color: string
  className?: string
}) {
  const known = values.filter((v) => v !== null)
  const sized = className
    ? { className: cn('shrink-0', className), preserveAspectRatio: 'none' }
    : { width: WIDTH, height: HEIGHT, className: 'shrink-0' }
  if (known.length < 2) return <svg {...sized} aria-hidden />
  const min = Math.min(...known)
  const span = Math.max(...known) - min || 1
  const x = (i: number) => (i / (values.length - 1)) * WIDTH
  const y = (v: number) => HEIGHT - 2 - ((v - min) / span) * (HEIGHT - 4)
  const path = values
    .map((v, i) => {
      if (v === null) return ''
      const move = i === 0 || values[i - 1] === null ? 'M' : 'L'
      return `${move}${x(i).toFixed(1)},${y(v).toFixed(1)}`
    })
    .join('')
  return (
    <svg {...sized} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
