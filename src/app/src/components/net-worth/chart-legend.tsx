import type { ChartLine } from '#/components/net-worth/chart-lines'

/** The colours of what the chart draws, a dot and a name each. */
export function ChartLegend({ lines }: { lines: ReadonlyArray<ChartLine> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {lines.map((line) => (
        <li key={line.key} className="flex min-w-0 items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: line.color }}
          />
          <span className="truncate">{line.label}</span>
        </li>
      ))}
    </ul>
  )
}
