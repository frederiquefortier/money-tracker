import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Money } from '#/components/display/money'
import { Sparkline } from '#/components/display/sparkline'
import { GROUP_COLORS } from '#/components/net-worth/chart-lines'
import { ChangeText } from '#/components/net-worth/change-text'
import { EntryRow } from '#/components/net-worth/entry-row'
import { HoldingFigures } from '#/components/net-worth/holding-figures'
import { NetWorthChart } from '#/components/net-worth/net-worth-chart'
import { OwedMoney } from '#/components/net-worth/owed-money'
import { focusRing } from '#/components/styles'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { rangeChange, returnOver } from '#/lib/net-worth/net-worth-range'
import { cn } from '#/lib/utils'
import type { NetWorthChartState } from '#/hooks/net-worth/use-net-worth-chart'
import type { NetWorthEntry } from '#/lib/net-worth/net-worth-list'

/**
 * Its change over the range, an investment's without what went in or out (ADR-062), or a
 * dash when it has none to compare.
 */
function ItemChange({
  entry,
  chart,
  currency,
}: {
  entry: NetWorthEntry
  chart: NetWorthChartState
  currency: string
}) {
  const change =
    entry.group === 'investments'
      ? returnOver(chart.itemPoints, entry.id, {
          flows: chart.flows.get(entry.id) ?? [],
          range: chart.range,
        })
      : rangeChange(chart.itemPoints, entry.id, chart.range)
  if (change?.percent == null)
    return <span className="text-sm text-muted-foreground">—</span>
  return (
    <ChangeText
      change={change}
      currency={currency}
      lowerIsBetter={entry.group === 'debts'}
      percentOnly
      className="text-sm"
    />
  )
}

/**
 * The item's line over the range, as a button outside the row's link: it opens the item's
 * chart under the row (author, 2026-11-18).
 */
function SparklineToggle({
  open,
  panel,
  label,
  values,
  color,
  onToggle,
}: {
  open: boolean
  panel: string
  label: string
  values: ReadonlyArray<number | null>
  color: string
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={panel}
      aria-label={t(open ? 'common.collapseName' : 'common.expandName', {
        name: label,
      })}
      onClick={onToggle}
      className={cn(
        'relative mx-2 grid shrink-0 place-items-center rounded-md p-0.5 hover:bg-secondary',
        open && 'bg-secondary',
        focusRing,
      )}
    >
      <Sparkline values={values} color={color} />
    </button>
  )
}

/** The value in its own currency (a debt as owed) over its change. */
function Value({
  entry,
  chart,
  currency,
}: {
  entry: NetWorthEntry
  chart: NetWorthChartState
  currency: string
}) {
  return (
    // One width for every value from `sm`, so the sparklines before it line up; seven
    // figures fit.
    <span className="flex min-w-28 shrink-0 flex-col items-end font-mono sm:w-40">
      {entry.group === 'debts' ? (
        <OwedMoney
          owed={entry.value}
          currency={entry.currency}
          className="text-lg font-semibold"
        />
      ) : (
        <Money
          amount={entry.value}
          currency={entry.currency}
          className="text-lg font-semibold"
        />
      )}
      <ItemChange entry={entry} chart={chart} currency={currency} />
    </span>
  )
}

/** Where an open item has its value and change: the day it was archived. */
function ClosedOn({ date }: { date: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <span className="min-w-28 shrink-0 text-right text-sm whitespace-nowrap sm:w-40">
      {t('netWorth.closedOn', { date: formatDate(date, locale, 'medium') })}
    </span>
  )
}

/**
 * An item with its line, its value, and its chart under it on demand. An archived one
 * (author, 2026-11-18) draws its whole history, whatever the range, and gives its closing
 * date for a value: its line ends at 0, so a change would only read its closing.
 */
export function ItemRow({
  entry,
  label,
  chart,
  currency,
}: {
  entry: NetWorthEntry
  label: string
  chart: NetWorthChartState
  currency: string
}) {
  const panel = useId()
  const [open, setOpen] = useState(false)
  const color = GROUP_COLORS[entry.group]
  const points = entry.closedOn ? chart.historyPoints : chart.itemPoints
  const values = points.map((p) => p.values[entry.id])
  const drawn = values.some((v) => v !== undefined)
  return (
    <>
      <EntryRow
        entry={entry}
        label={label}
        hidden={chart.excluded.ids.has(entry.id)}
        trailing={
          // The line before the value (author, 2026-11-18); the value, under the row's
          // stretched link, still opens the form.
          <>
            {drawn ? (
              <SparklineToggle
                open={open}
                panel={panel}
                label={label}
                values={values.map((v) =>
                  typeof v === 'string' ? Number(v) : null,
                )}
                color={color}
                onToggle={() => setOpen(!open)}
              />
            ) : (
              // The same room, so the values line up.
              <span aria-hidden="true" className="mx-2 w-17 shrink-0" />
            )}
            {entry.closedOn ? (
              <ClosedOn date={entry.closedOn} />
            ) : (
              <Value entry={entry} chart={chart} currency={currency} />
            )}
          </>
        }
      />
      {open && drawn && (
        // Room above, so the chart's tooltip and cursor never touch the row's name.
        <li id={panel} className="px-4 pt-4 pb-4">
          {entry.type === 'holding' && entry.holding.kind === 'investment' && (
            <HoldingFigures holding={entry.holding} />
          )}
          <NetWorthChart
            points={points}
            dataKey={entry.id}
            color={color}
            label={label}
            currency={currency}
            className="h-40"
          />
        </li>
      )}
    </>
  )
}
