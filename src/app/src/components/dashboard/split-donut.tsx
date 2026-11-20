import { Cell, Pie, PieChart } from 'recharts'
import { CategoryBadge } from '#/components/categories/category-badge'
import type { ChartSeries } from '#/components/dashboard/chart-parts'
import { Figure } from '#/components/dashboard/dashboard-card'
import { Percent } from '#/components/display/percent'
import { ChartContainer, ChartTooltip } from '#/components/ui/chart'
import type { StackSeries } from '#/lib/dashboard/category-stacks'

/** A series as both charts draw it: its name and colour, its total and share. */
export type Part = ChartSeries & Omit<StackSeries, 'key'>

function Donut({
  parts,
  currency,
}: {
  parts: ReadonlyArray<Part>
  currency: string
}) {
  const data = parts
    .filter((p) => p.total !== null && Number(p.total) > 0)
    .map((p) => ({ key: p.key, value: Number(p.total), part: p }))
  return (
    <ChartContainer config={{}} className="mx-auto aspect-square w-44">
      <PieChart>
        <ChartTooltip
          content={({ active, payload }) => {
            const part = (payload[0]?.payload as { part?: Part } | undefined)
              ?.part
            if (!active || !part) return null
            return (
              <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
                <p className="font-semibold">{part.label}</p>
                <Figure amount={part.total} currency={currency} />
              </div>
            )
          }}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius="60%"
          outerRadius="100%"
          stroke="var(--card)"
          strokeWidth={2}
          isAnimationActive={false}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.part.color} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

function PartRow({ part, currency }: { part: Part; currency: string }) {
  return (
    <li className="flex items-center gap-2 py-1.5 text-sm">
      {part.category ? (
        <CategoryBadge
          icon={part.category.icon}
          color={part.category.color}
          size="sm"
        />
      ) : (
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: part.color }}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{part.label}</span>
      {part.share !== null && (
        <span className="text-xs text-muted-foreground">
          <Percent points={part.share} digits={0} />
        </span>
      )}
      <Figure
        amount={part.total}
        currency={currency}
        className="font-semibold"
      />
    </li>
  )
}

/** The whole as a donut beside its parts, each with its share and amount. */
export function SplitDonut({
  parts,
  currency,
}: {
  parts: ReadonlyArray<Part>
  currency: string
}) {
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[11rem_1fr]">
      <Donut parts={parts} currency={currency} />
      <ul className="flex flex-col divide-y">
        {parts.map((part) => (
          <PartRow key={part.key} part={part} currency={currency} />
        ))}
      </ul>
    </div>
  )
}
