import { useState } from 'react'
import { ChoiceMenu } from '#/components/display/choice-menu'
import {
  ACCOUNTS_PAGE,
  HOLDINGS_PAGE,
  ITEMS,
  SERIES,
} from '#/components/design/net-worth-demo'
import {
  ARCHIVED_FLOWS,
  ARCHIVED_HOLDING,
  ARCHIVED_ITEM,
  ARCHIVED_SERIES,
} from '#/components/design/net-worth-demo-archived'
import { FLOWS } from '#/components/design/net-worth-demo-flows'
import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { pageWidth } from '#/components/styles'
import { cn } from '#/lib/utils'
import { ItemList } from '#/components/net-worth/item-list'
import { NetWorthDashboard } from '#/components/net-worth/net-worth-dashboard'
import { useLocale } from '#/hooks/app/use-locale'
import { useStoredIds } from '#/hooks/app/use-stored-state'
import { useNetWorthChart } from '#/hooks/net-worth/use-net-worth-chart'
import { FORMAT_LOCALE } from '#/i18n/locales'
import {
  GROUP_BYS,
  groupEntries,
  netWorthEntries,
} from '#/lib/net-worth/net-worth-list'
import type { GroupBy } from '#/lib/net-worth/net-worth-list'

// Invented figures only (net-worth-demo.ts), with one archived investment.
const DEMO_SERIES = [...SERIES, ...ARCHIVED_SERIES]
const DEMO_ITEMS = [...ITEMS, ARCHIVED_ITEM]
const DEMO_FLOWS = [...FLOWS, ...ARCHIVED_FLOWS]
const DEMO_HOLDINGS = {
  ...HOLDINGS_PAGE,
  holdings: [...HOLDINGS_PAGE.holdings, ARCHIVED_HOLDING],
}

/** The hub as the route draws it, with a stand-in grouping menu above the list. */
function DemoHub() {
  const locale = useLocale()
  const chart = useNetWorthChart(DEMO_SERIES, DEMO_ITEMS, DEMO_FLOWS)
  const [groupBy, setGroupBy] = useState<GroupBy>('type')
  const collapsed = useStoredIds('design.netWorth.collapsed')
  const entries = netWorthEntries({
    accounts: ACCOUNTS_PAGE,
    holdings: DEMO_HOLDINGS,
    items: DEMO_ITEMS,
    locale,
  })
  const groups = groupEntries(entries, {
    by: groupBy,
    sort: 'name',
    locale: FORMAT_LOCALE[locale],
    institutions: ACCOUNTS_PAGE.institutions,
  })
  return (
    // The page column, as the route draws it.
    <div className={cn('w-full xl:max-w-none', pageWidth)}>
      <NetWorthDashboard
        chart={chart}
        total="245000"
        currency="CAD"
        converted={false}
        items={DEMO_ITEMS}
        controls={
          <ChoiceMenu
            label="Group"
            value={groupBy}
            options={GROUP_BYS}
            labelOf={(option) => option}
            onChange={setGroupBy}
          />
        }
        list={
          <ItemList
            entries={entries}
            groups={groups}
            chart={chart}
            currency="CAD"
            collapsed={collapsed.ids}
            onToggle={collapsed.toggle}
          />
        }
      />
    </div>
  )
}

export function NetWorthSection() {
  return (
    <GallerySection id="net-worth" title="Net worth">
      <Specimen
        name="NetWorthDashboard, ItemList"
        source="net-worth/net-worth-dashboard.tsx"
      >
        <DemoHub />
      </Specimen>
    </GallerySection>
  )
}
