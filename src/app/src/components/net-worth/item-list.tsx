import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { MissingRate, Money } from '#/components/display/money'
import { Sparkline } from '#/components/display/sparkline'
import { GROUP_COLORS } from '#/components/net-worth/chart-lines'
import { ChangeText } from '#/components/net-worth/change-text'
import { NetWorthChart } from '#/components/net-worth/net-worth-chart'
import { GroupHeader } from '#/components/lists/group-header'
import { ListCard } from '#/components/lists/list-card'
import { focusRing, rowHover } from '#/components/styles'
import { useLocale } from '#/hooks/app/use-locale'
import { rangeChange } from '#/lib/net-worth/net-worth-range'
import {
  ITEM_GROUPS,
  STACK_KEYS,
  chartItemLabel,
} from '#/lib/net-worth/net-worth-series'
import { absDecimal } from '#/lib/shared/money'
import { cn } from '#/lib/utils'
import type { NetWorthChartState } from '#/hooks/net-worth/use-net-worth-chart'
import type { ChartItem, ItemGroup } from '#/lib/net-worth/net-worth-series'

/** Its change over the range, or a dash when it has none to compare (new, or from 0). */
function ItemChange({
  item,
  chart,
  currency,
}: {
  item: ChartItem
  chart: NetWorthChartState
  currency: string
}) {
  const change = rangeChange(chart.itemPoints, item.id, chart.range)
  if (change?.percent == null)
    return <span className="text-sm text-muted-foreground">—</span>
  return (
    <ChangeText
      change={change}
      currency={currency}
      lowerIsBetter={item.group === 'debts'}
      percentOnly
      className="text-sm"
    />
  )
}

function ItemRow({
  item,
  chart,
  currency,
}: {
  item: ChartItem
  chart: NetWorthChartState
  currency: string
}) {
  const locale = useLocale()
  const panel = useId()
  const [open, setOpen] = useState(false)
  const label = chartItemLabel(item, locale)
  const color = GROUP_COLORS[item.group]
  const values = chart.itemPoints.map((p) => p.values[item.id])
  const last = values.findLast((v) => v !== undefined)
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left',
          rowHover,
          focusRing,
        )}
      >
        <span className="min-w-0 flex-1 truncate font-semibold">{label}</span>
        <span className="hidden sm:block">
          <Sparkline
            values={values.map((v) =>
              typeof v === 'string' ? Number(v) : null,
            )}
            color={color}
          />
        </span>
        {/* One width for every value, so the sparklines line up in one column; seven figures
            fit. Phones hide the sparkline and give the room to the name. */}
        <span className="flex shrink-0 flex-col items-end font-mono sm:w-40">
          {last === null ? (
            <MissingRate />
          ) : (
            last !== undefined && (
              <Money
                amount={last}
                currency={currency}
                className="text-lg font-semibold"
              />
            )
          )}
          <ItemChange item={item} chart={chart} currency={currency} />
        </span>
        <Icon
          name="chevron-down"
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        // Room above, so the chart's tooltip and cursor never touch the row's name.
        <div id={panel} className="px-4 pt-4 pb-4">
          <NetWorthChart
            points={chart.itemPoints}
            dataKey={item.id}
            color={color}
            label={label}
            currency={currency}
            className="h-40"
          />
        </div>
      )}
    </li>
  )
}

/** What a group adds up to today, debts owed. */
function Subtotal({
  group,
  chart,
  currency,
}: {
  group: ItemGroup
  chart: NetWorthChartState
  currency: string
}) {
  const subtotal = chart.totals.at(-1)?.values[STACK_KEYS[group]]
  if (subtotal === null) return <MissingRate />
  if (subtotal === undefined) return null
  return (
    <Money
      amount={group === 'debts' ? absDecimal(subtotal) : subtotal}
      currency={currency}
    />
  )
}

/**
 * The counted items by group, each group's header over its own card as the transactions'
 * days (author, 2026-11-17), as the spreadsheet's table: each with its line over the
 * range, its value and its change over the range. A row opens its own chart, at its own
 * scale (author, 2026-11-17).
 */
export function ItemList({
  chart,
  currency,
}: {
  chart: NetWorthChartState
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  // Only items with a figure in the range.
  const shown = chart.counted.filter((i) =>
    chart.itemPoints.some((p) => i.id in p.values),
  )
  if (shown.length === 0) return null
  return (
    <div className="flex flex-col gap-4">
      {ITEM_GROUPS.map((group) => {
        const rows = shown
          .filter((i) => i.group === group)
          .sort((a, b) =>
            chartItemLabel(a, locale).localeCompare(
              chartItemLabel(b, locale),
              locale,
            ),
          )
        if (rows.length === 0) return null
        return (
          <section key={group} className="flex flex-col gap-2">
            <GroupHeader
              color={GROUP_COLORS[group]}
              aside={
                <Subtotal group={group} chart={chart} currency={currency} />
              }
            >
              {t(`netWorth.chart.groups.${group}`)}
            </GroupHeader>
            <ListCard>
              {rows.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  chart={chart}
                  currency={currency}
                />
              ))}
            </ListCard>
          </section>
        )
      })}
    </div>
  )
}
