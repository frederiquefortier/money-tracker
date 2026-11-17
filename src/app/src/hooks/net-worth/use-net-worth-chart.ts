import { useMemo, useState } from 'react'
import { useStoredIds, useStoredState } from '#/hooks/app/use-stored-state'
import {
  ITEM_GROUPS,
  STACK_KEYS,
  hasFigures,
  itemPoints,
  seriesPoints,
} from '#/lib/net-worth/net-worth-series'
import { parseRange, pointsInRange } from '#/lib/net-worth/net-worth-range'
import { todayIso } from '#/lib/shared/format'
import type { ChartItem, SeriesRow } from '#/lib/net-worth/net-worth-series'
import type { SeriesRange } from '#/lib/net-worth/net-worth-range'

/**
 * The hub's choices, kept per browser (NW-05), and the figures they give. The range is
 * what the charts draw and what every change on the page is measured over.
 */
export function useNetWorthChart(
  series: ReadonlyArray<SeriesRow>,
  items: ReadonlyArray<ChartItem>,
) {
  const [range, setRange] = useStoredState<SeriesRange>(
    'netWorth.chart.range',
    'all',
    parseRange,
  )
  const [hideOpen, setHideOpen] = useState(false)
  const excluded = useStoredIds('netWorth.chart.excluded')
  const excludedKey = [...excluded.ids].sort().join()

  const groups = useMemo(
    () => new Map(items.map((i) => [i.id, i.group])),
    [items],
  )
  const totals = useMemo(
    () => seriesPoints(series, excluded.ids, groups),
    // The set is new at each render; its content is the key.
    [series, groups, excludedKey],
  )
  const perItem = useMemo(
    () => itemPoints(series, excluded.ids, groups),
    [series, groups, excludedKey],
  )
  const today = todayIso()
  const counted = items.filter((i) => !excluded.ids.has(i.id))

  return {
    range,
    setRange,
    excluded,
    hideOpen,
    setHideOpen,
    counted,
    leftOut: items.length - counted.length,
    /** The groups with a figure somewhere: a group always zero is not drawn. */
    groups: ITEM_GROUPS.filter((g) => hasFigures(totals, STACK_KEYS[g])),
    /** Every date without the hidden items. */
    totals,
    /** The totals over the range. */
    points: pointsInRange(totals, range, today),
    /** Each counted item over the range. */
    itemPoints: pointsInRange(perItem, range, today),
  }
}

export type NetWorthChartState = ReturnType<typeof useNetWorthChart>
