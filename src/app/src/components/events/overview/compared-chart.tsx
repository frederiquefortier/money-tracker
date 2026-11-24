import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CHART_MARGIN,
  drawn,
  moneyAxis,
  progressCells,
  tooltipFor,
} from '#/components/dashboard/chart-parts'
import type { ChartSeries } from '#/components/dashboard/chart-parts'
import { ChartContainer, ChartTooltip } from '#/components/ui/chart'
import { useBarPointer } from '#/hooks/dashboard/use-bar-pointer'
import { useLocale } from '#/hooks/app/use-locale'
import type { Category } from '#/lib/categories/category'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { eventSearch } from '#/lib/dashboard/drill-down'
import type { EventSummary } from '#/lib/events/event-calendar'
import type { EventPart } from '#/lib/events/event-parts'
import type { Locale } from '#/i18n/locales'
import { formatMonth, moneyFormat } from '#/lib/shared/format'

type Parts = ReadonlyMap<string, ReadonlyArray<EventPart> | null>

const TOTAL = 'total'

/**
 * Each column's label: the month on a year; on Tout, the year under its first event only,
 * so a year with many events is named once.
 */
function tickLabels(
  events: ReadonlyArray<EventSummary>,
  yearly: boolean,
  locale: Locale,
): Map<string, string> {
  return new Map(
    events.map((summary, i) => {
      const year = summary.from.slice(0, 4)
      const first = events[i - 1]?.from.slice(0, 4) !== year
      if (!yearly)
        return [
          summary.event.id,
          formatMonth(summary.from.slice(0, 7), locale, 'short'),
        ]
      return [summary.event.id, first ? year : '']
    }),
  )
}

/** The dashed line at the mean, named "Moyenne 173 $" at its right end. */
function meanLine(
  usual: string | null,
  name: string,
  format: { currency: string; locale: Locale },
) {
  const { currency, locale } = format
  if (usual === null) return null
  const amount = moneyFormat(currency, locale, { whole: true }).format(
    usual as Intl.StringNumericLiteral,
  )
  return (
    <ReferenceLine
      y={Number(usual)}
      stroke="var(--foreground)"
      strokeOpacity={0.6}
      strokeDasharray="4 4"
      ifOverflow="extendDomain"
      label={{
        value: `${name} ${amount}`,
        position: 'insideTopRight',
        fill: 'var(--muted-foreground)',
        fontSize: 12,
      }}
    />
  )
}

/**
 * The top-level categories found in the events, the largest overall first so it sits at
 * the bottom of every column, each in its colour; and each event's parts to draw.
 */
function partsChart(
  events: ReadonlyArray<EventSummary>,
  parts: Parts,
  categories: ReadonlyArray<Category>,
) {
  const weight = new Map<string, number>()
  for (const e of events)
    for (const p of parts.get(e.event.id) ?? [])
      weight.set(
        p.categoryId,
        (weight.get(p.categoryId) ?? 0) + Number(p.perDay),
      )
  const series: Array<ChartSeries> = [...weight]
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => {
      const category = categories.find((c) => c.id === id)
      return {
        key: id,
        label: category?.name ?? '',
        color: category?.color ?? 'var(--muted-foreground)',
      }
    })
  const rows = events.map((e) => ({
    key: e.event.id,
    ...Object.fromEntries(
      (parts.get(e.event.id) ?? []).map((p) => [
        p.categoryId,
        Number(p.perDay),
      ]),
    ),
  }))
  return { series, rows }
}

/** An event's figures for the tooltip: its whole per day, then each part. */
function figuresOf(byId: ReadonlyMap<string, EventSummary>, parts: Parts) {
  return (key: string) => {
    const summary = byId.get(key)
    if (!summary) return undefined
    return {
      [TOTAL]: summary.perDay,
      ...Object.fromEntries(
        (parts.get(key) ?? []).map((p) => [p.categoryId, p.perDay]),
      ),
    }
  }
}

/** Each category's colour and name, under the chart. */
function PartsLegend({ series }: { series: ReadonlyArray<ChartSeries> }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: s.color }}
          />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

/**
 * EVT-05: the events in date order as columns of their cost per day, cut into their
 * top-level categories, the mean over every year a dashed line named at its end (author,
 * 2026-11-23). A part opens the event's transactions in that category.
 */
export function ComparedChart({
  events,
  parts,
  categories,
  usual,
  period,
  currency,
}: {
  events: ReadonlyArray<EventSummary>
  parts: Parts
  categories: ReadonlyArray<Category>
  usual: string | null
  period: DashboardPeriod
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const navigate = useNavigate()
  const { handlers, hoveredIn } = useBarPointer((categoryId, key) => {
    void navigate({
      to: '/transactions',
      search: eventSearch(period, key, categoryId),
    })
  })
  const dated = [...events].sort((a, b) => a.from.localeCompare(b.from))
  const byId = new Map(dated.map((e) => [e.event.id, e]))
  const { series, rows } = partsChart(dated, parts, categories)
  const labels = tickLabels(dated, period.unit === 'all', locale)
  const total = {
    key: TOTAL,
    label: t('dashboard.events.totalPerDay'),
    color: 'transparent',
  }
  return (
    <div className="flex flex-col gap-2">
      <ChartContainer
        config={Object.fromEntries(series.map((s) => [s.key, s]))}
        className="aspect-auto h-56 w-full"
      >
        <BarChart data={rows} margin={{ ...CHART_MARGIN, top: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="key"
            tickLine={false}
            axisLine={false}
            interval={0}
            tickFormatter={(key: string) => labels.get(key) ?? ''}
          />
          <YAxis
            {...moneyAxis(
              [...dated.map((e) => drawn(e.perDay)), drawn(usual)],
              currency,
              locale,
            )}
          />
          <ChartTooltip
            cursor={false}
            content={tooltipFor({
              series: [total, ...series],
              currency,
              titleOf: (key) => byId.get(key)?.event.name ?? '',
              figuresOf: figuresOf(byId, parts),
            })}
          />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="perDay"
              fill={s.color}
              maxBarSize={48}
              isAnimationActive={false}
              {...handlers(s.key)}
            >
              {progressCells(rows, '', hoveredIn(s.key))}
            </Bar>
          ))}
          {meanLine(usual, t('dashboard.events.mean'), { currency, locale })}
        </BarChart>
      </ChartContainer>
      <PartsLegend series={series} />
    </div>
  )
}
