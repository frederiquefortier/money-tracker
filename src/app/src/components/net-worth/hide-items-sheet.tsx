import { useTranslation } from 'react-i18next'
import { IconButton } from '#/components/display/icon-button'
import { CheckList } from '#/components/forms/check-list'
import type { CheckNode, CheckState } from '#/components/forms/check-list'
import { GROUP } from '#/components/forms/check-ticks'
import { Sheet, SheetBody, SheetContent } from '#/components/ui/sheet'
import { chartItemLabel } from '#/lib/net-worth/net-worth-series'
import { useLocale } from '#/hooks/app/use-locale'
import type { ChartItem } from '#/lib/net-worth/net-worth-series'
import type { NetWorthChartState } from '#/hooks/net-worth/use-net-worth-chart'

function institutionOf(item: ChartItem) {
  return item.type === 'account' ? item.institution : item.parts.institution
}

/** Open items by institution, A to Z, then those with none, then the archived ones. */
function useItemNodes(items: ReadonlyArray<ChartItem>): Array<CheckNode> {
  const { t } = useTranslation()
  const locale = useLocale()
  const byLabel = (a: CheckNode, b: CheckNode) =>
    a.label.localeCompare(b.label, locale)
  const groups = new Map<string, Array<CheckNode>>()
  const none: Array<CheckNode> = []
  const archived: Array<CheckNode> = []
  for (const item of items) {
    const institution = institutionOf(item)
    if (item.closed) {
      archived.push({ id: item.id, label: chartItemLabel(item, locale) })
      continue
    }
    const node = {
      id: item.id,
      label: chartItemLabel(item, locale, institution !== null),
    }
    if (institution === null) none.push(node)
    else groups.set(institution, [...(groups.get(institution) ?? []), node])
  }
  const group = (id: string, label: string, children: Array<CheckNode>) => ({
    id: `${GROUP}${id}`,
    label,
    children: children.sort(byLabel),
  })
  return [
    ...[...groups]
      .sort(([a], [b]) => a.localeCompare(b, locale))
      .map(([name, children]) => group(name, name, children)),
    ...(none.length ? [group('none', t('accounts.noInstitution'), none)] : []),
    ...(archived.length
      ? [group('archived', t('netWorth.chart.archived'), archived)]
      : []),
  ]
}

/** Beside the page title: the eye opens the list of what to hide (NW-05). */
export function HideItemsButton({ chart }: { chart: NetWorthChartState }) {
  const { t } = useTranslation()
  return (
    <IconButton
      icon={chart.leftOut > 0 ? 'eye-off' : 'eye'}
      label={
        chart.leftOut > 0
          ? t('netWorth.hide.labelCount', { count: chart.leftOut })
          : t('netWorth.hide.label')
      }
      pressed={chart.leftOut > 0}
      onClick={() => chart.setHideOpen(true)}
    />
  )
}

/**
 * The accounts and holdings, ticked when hidden. A hidden item leaves the chart, the
 * sidebar's figures and the item list, remembered per browser (NW-05, ADR-058).
 */
export function HideItemsSheet({
  chart,
  items,
}: {
  chart: NetWorthChartState
  items: ReadonlyArray<ChartItem>
}) {
  const { t } = useTranslation()
  const nodes = useItemNodes(items)
  const hidden = chart.excluded.ids
  // Ticked is hidden (author, 2026-11-17): the sheet is "Masquer des éléments".
  const stateOf = (node: CheckNode): CheckState => {
    if (!node.children) return hidden.has(node.id) ? 'on' : 'off'
    const count = node.children.filter((c) => hidden.has(c.id)).length
    if (count === 0) return 'off'
    return count === node.children.length ? 'on' : 'mixed'
  }
  const toggle = (node: CheckNode) => {
    if (!node.children) return chart.excluded.toggle(node.id)
    chart.excluded.setAll(
      node.children.map((c) => c.id),
      stateOf(node) !== 'on',
    )
  }
  return (
    <Sheet
      open={chart.hideOpen}
      onOpenChange={(next) => !next && chart.setHideOpen(false)}
    >
      <SheetContent
        title={t('netWorth.hide.label')}
        closeLabel={t('common.close')}
      >
        <SheetBody>
          <CheckList nodes={nodes} stateOf={stateOf} onToggle={toggle} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
