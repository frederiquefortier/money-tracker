import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Cell, Pie, PieChart } from 'recharts'
import { CategoryBadge } from '#/components/categories/category-badge'
import type { ChartSeries } from '#/components/dashboard/chart-parts'
import { Figure } from '#/components/dashboard/dashboard-card'
import { Percent } from '#/components/display/percent'
import { ChartContainer, ChartTooltip } from '#/components/ui/chart'
import { focusRing, rowHover } from '#/components/styles'
import { useScrollMore } from '#/hooks/app/use-scroll-more'
import type { StackSeries } from '#/lib/dashboard/category-stacks'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { periodSearch } from '#/lib/dashboard/drill-down'
import { cn } from '#/lib/utils'

/** A series as both charts draw it: its name and colour, its total and share. */
export type Part = ChartSeries & Omit<StackSeries, 'key'>

// Each edge of the list fades while more parts sit past it.
const FADE_LENGTH = '2.5rem'

function fadeMask(above: boolean, below: boolean): string | undefined {
  if (!above && !below) return undefined
  const top = above ? `transparent, black ${FADE_LENGTH}` : 'black'
  const bottom = below
    ? `black calc(100% - ${FADE_LENGTH}), transparent`
    : 'black'
  return `linear-gradient(to bottom, ${top}, ${bottom})`
}

/** A slice opens its category's transactions; the hovered one stays bright. */
function Donut({
  parts,
  period,
  currency,
}: {
  parts: ReadonlyArray<Part>
  period: DashboardPeriod
  currency: string
}) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const partOf = (data: unknown) =>
    (data as { payload?: { part?: Part } } | null)?.payload?.part
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
          // From 12 o'clock, clockwise, in the list's order.
          startAngle={90}
          endAngle={-270}
          stroke="var(--card)"
          strokeWidth={2}
          isAnimationActive={false}
          onMouseEnter={(slice: unknown) =>
            setHovered(partOf(slice)?.key ?? null)
          }
          onMouseLeave={() => setHovered(null)}
          onClick={(slice: unknown) => {
            const id = partOf(slice)?.category?.id
            if (id)
              void navigate({
                to: '/transactions',
                search: periodSearch(period, id),
              })
          }}
        >
          {data.map((d) => (
            <Cell
              key={d.key}
              fill={d.part.color}
              fillOpacity={hovered && hovered !== d.key ? 0.4 : 1}
              className={d.part.category ? 'cursor-pointer' : undefined}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

function PartContent({ part, currency }: { part: Part; currency: string }) {
  return (
    <>
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
          <Percent points={part.share} />
        </span>
      )}
      <Figure
        amount={part.total}
        currency={currency}
        className="font-semibold"
      />
    </>
  )
}

/** A part; a category's opens its transactions over the period. */
function PartRow({
  part,
  period,
  currency,
}: {
  part: Part
  period: DashboardPeriod
  currency: string
}) {
  const row = 'flex items-center gap-2 px-1 py-1.5 text-sm'
  if (!part.category)
    return (
      <li className={row}>
        <PartContent part={part} currency={currency} />
      </li>
    )
  return (
    <li className={rowHover}>
      <Link
        to="/transactions"
        search={periodSearch(period, part.category.id)}
        className={cn(row, 'rounded-md', focusRing)}
      >
        <PartContent part={part} currency={currency} />
      </Link>
    </li>
  )
}

/**
 * The whole as a donut beside its parts, each with its share and amount. The list scrolls
 * past a set height, so a long one never stretches the card.
 */
export function SplitDonut({
  parts,
  period,
  currency,
}: {
  parts: ReadonlyArray<Part>
  period: DashboardPeriod
  currency: string
}) {
  const list = useScrollMore<HTMLUListElement>()
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[11rem_1fr]">
      <Donut parts={parts} period={period} currency={currency} />
      <ul
        ref={list.ref}
        className="flex max-h-72 flex-col divide-y overflow-y-auto"
        style={{ maskImage: fadeMask(list.start, list.end) }}
      >
        {parts.map((part) => (
          <PartRow
            key={part.key}
            part={part}
            period={period}
            currency={currency}
          />
        ))}
      </ul>
    </div>
  )
}
