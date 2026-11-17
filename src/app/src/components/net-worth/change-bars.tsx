import { useTranslation } from 'react-i18next'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { MissingRate, Money } from '#/components/display/money'
import { ChartContainer, ChartTooltip } from '#/components/ui/chart'
import { ChartLegend } from '#/components/net-worth/chart-legend'
import { GROUP_COLORS } from '#/components/net-worth/chart-lines'
import { MONTHLY_UP_TO, periodChanges } from '#/lib/net-worth/net-worth-range'
import { STACK_KEYS, axisTicks } from '#/lib/net-worth/net-worth-series'
import { formatAxisMoney, formatMonth } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import type { ChartLine } from '#/components/net-worth/chart-lines'
import type { Locale } from '#/i18n/locales'
import type { PeriodChange } from '#/lib/net-worth/net-worth-range'
import type { ItemGroup, SeriesPoint } from '#/lib/net-worth/net-worth-series'

const NET = 'total'
const NET_COLOR = 'var(--foreground)'

function periodLabel(date: string, byYear: boolean, locale: Locale) {
  return byYear ? date.slice(0, 4) : formatMonth(date, locale)
}

type Drawing = {
  changes: ReadonlyArray<PeriodChange>
  lines: ReadonlyArray<ChartLine>
  byYear: boolean
  currency: string
  locale: Locale
}

function tooltipFor({ changes, lines, byYear, currency, locale }: Drawing) {
  const byDate = new Map(changes.map((c) => [c.date, c]))
  return function Content({
    active,
    payload,
  }: {
    active?: boolean
    payload?: ReadonlyArray<{ payload?: unknown }>
  }) {
    const row = payload?.[0]?.payload as { date?: string } | undefined
    const change = row?.date === undefined ? undefined : byDate.get(row.date)
    if (!active || !change) return null
    return (
      <div className="grid min-w-48 gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-semibold capitalize">
          {periodLabel(change.date, byYear, locale)}
        </p>
        {lines.map((line) => {
          const value = change.values[line.key]
          return (
            <p key={line.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ background: line.color }}
              />
              <span
                className={
                  line.key === NET
                    ? 'flex-1 font-semibold'
                    : 'flex-1 text-muted-foreground'
                }
              >
                {line.label}
              </span>
              {value == null ? (
                <MissingRate />
              ) : (
                <Money amount={value} currency={currency} signed />
              )}
            </p>
          )
        })}
      </div>
    )
  }
}

/** Numbers for the drawing only, and the axis over the stacked gains and losses. */
function drawnRows(
  changes: ReadonlyArray<PeriodChange>,
  keys: ReadonlyArray<string>,
) {
  const rows = changes.map((c) => ({
    date: c.date,
    ...Object.fromEntries(
      Object.entries(c.values).map(([key, value]) => [
        key,
        value === null ? null : Number(value),
      ]),
    ),
  }))
  const sums = rows.flatMap((row: Record<string, unknown>) => {
    const parts = keys.map((k) => (typeof row[k] === 'number' ? row[k] : 0))
    return [
      parts.filter((v) => v > 0).reduce((a, b) => a + b, 0),
      parts.filter((v) => v < 0).reduce((a, b) => a + b, 0),
    ]
  })
  return { rows, y: axisTicks(Math.min(0, ...sums), Math.max(0, ...sums)) }
}

function BarsChart({
  drawing,
  groups,
}: {
  drawing: Drawing
  groups: ReadonlyArray<ItemGroup>
}) {
  const { changes, byYear, currency, locale } = drawing
  const { rows, y } = drawnRows(
    changes,
    groups.map((g) => STACK_KEYS[g]),
  )
  return (
    <ChartContainer config={{}} className="aspect-auto h-48 w-full">
      <ComposedChart
        data={rows}
        margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
        stackOffset="sign"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={16}
          tickFormatter={(date: string) =>
            byYear ? date.slice(0, 4) : formatMonth(date, locale, 'short')
          }
        />
        <YAxis
          width={60}
          ticks={y}
          domain={[y[0], y[y.length - 1]]}
          interval={0}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) =>
            formatAxisMoney(value, currency, locale)
          }
        />
        <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
          content={tooltipFor(drawing)}
        />
        {groups.map((g) => (
          <Bar
            key={g}
            dataKey={STACK_KEYS[g]}
            stackId="change"
            fill={GROUP_COLORS[g]}
            maxBarSize={48}
            isAnimationActive={false}
          />
        ))}
        <Line
          dataKey={NET}
          stroke="none"
          dot={{
            r: 3.5,
            fill: NET_COLOR,
            stroke: 'var(--card)',
            strokeWidth: 1.5,
          }}
          activeDot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

/**
 * What moved the net worth: each month's or year's change split by group, gains above 0
 * and losses below, with a dot at the net change. A debt paid down is a gain (NW-04).
 */
export function ChangeBars({
  points,
  groups,
  currency,
}: {
  points: ReadonlyArray<SeriesPoint>
  /** The groups drawn, in stacking order. */
  groups: ReadonlyArray<ItemGroup>
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const byYear = points.length > MONTHLY_UP_TO
  const changes = periodChanges(points, [
    ...groups.map((g) => STACK_KEYS[g]),
    NET,
  ])
  if (changes.length === 0) return null
  const lines: Array<ChartLine> = [
    ...groups.map((g) => ({
      key: STACK_KEYS[g],
      label: t(`netWorth.chart.groups.${g}`),
      color: GROUP_COLORS[g],
    })),
    { key: NET, label: t('netWorth.changes.net'), color: NET_COLOR },
  ]

  return (
    // Clear of the line's axis above it, so the two charts read apart.
    <section className="mt-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h3 className="text-sm font-semibold">
          {t(byYear ? 'netWorth.changes.byYear' : 'netWorth.changes.byMonth')}
        </h3>
        <ChartLegend lines={lines} />
      </div>
      <BarsChart
        drawing={{ changes, lines, byYear, currency, locale }}
        groups={groups}
      />
    </section>
  )
}
