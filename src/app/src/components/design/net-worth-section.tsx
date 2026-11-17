import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { NetWorthBackLink } from '#/components/net-worth/back-link'
import { HubCard } from '#/components/net-worth/hub-cards'
import { HideItemsButton } from '#/components/net-worth/hide-items-sheet'
import { NetWorthDashboard } from '#/components/net-worth/net-worth-dashboard'
import { useNetWorthChart } from '#/hooks/net-worth/use-net-worth-chart'
import type { ChartItem, SeriesRow } from '#/lib/net-worth/net-worth-series'

// Invented figures: three years of month ends for a few accounts and holdings.

const holding = (
  id: string,
  group: ChartItem['group'],
  name: string,
): ChartItem => ({
  id,
  closed: false,
  group,
  type: 'holding',
  parts: {
    name,
    typeFr: name,
    typeEn: name,
    institution: 'Demo Bank',
    currency: 'CAD',
  },
})

const ITEMS: Array<ChartItem> = [
  {
    id: 'demo-chq',
    closed: false,
    group: 'accounts',
    type: 'account',
    name: 'Chequing',
    institution: 'Demo Bank',
  },
  {
    id: 'demo-visa',
    closed: false,
    group: 'debts',
    type: 'account',
    name: 'Visa',
    institution: 'Demo Bank',
  },
  holding('demo-rrsp', 'investments', 'RRSP'),
  holding('demo-tfsa', 'investments', 'TFSA'),
  holding('demo-house', 'assets', 'House'),
  holding('demo-mortgage', 'debts', 'Mortgage'),
]

type Demo = [ChartItem['id'], SeriesRow['kind'], (i: number) => number]

const DEMO: Array<Demo> = [
  ['demo-chq', 'account', (i) => 3000 + ((i * 370) % 1900)],
  ['demo-rrsp', 'investment', (i) => 40000 + i * 900],
  ['demo-house', 'asset', (i) => 300000 + i * 1500],
]

const SERIES: Array<SeriesRow> = Array.from({ length: 36 }, (_, i) => {
  const onDate = new Date(Date.UTC(2023, i + 1, 0)).toISOString().slice(0, 10)
  const rows: Array<SeriesRow> = DEMO.map(([itemId, kind, value]) => ({
    onDate,
    kind,
    itemId,
    displayValue: String(value(i)),
  }))
  // The TFSA, the card and the mortgage start in the second year: their lines rise from
  // 0, and the first year has no debt at all.
  if (i >= 12)
    rows.push(
      {
        onDate,
        kind: 'investment',
        itemId: 'demo-tfsa',
        displayValue: String(5000 + (i - 12) * 600),
      },
      {
        onDate,
        kind: 'account',
        itemId: 'demo-visa',
        displayValue: String(-((i * 230) % 1200)),
      },
      {
        onDate,
        kind: 'debt',
        itemId: 'demo-mortgage',
        displayValue: String(-240000 + i * 1100),
      },
    )
  return rows
}).flat()

/** The hub as the route draws it, under a stand-in title row with the eye. */
function DemoHub() {
  const chart = useNetWorthChart(SERIES, ITEMS)
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex justify-end">
        <HideItemsButton chart={chart} />
      </div>
      <NetWorthDashboard
        chart={chart}
        total="245000"
        currency="CAD"
        converted={false}
        items={ITEMS}
        links={
          <>
            <HubCard
              to="/net-worth/accounts"
              icon="wallet"
              title="Comptes"
              detail="2 comptes"
              total="3700"
              currency="CAD"
              converted={false}
            />
            <HubCard
              to="/net-worth/holdings"
              icon="coins"
              title="Avoirs"
              detail="4 avoirs"
              total="241300"
              currency="CAD"
              converted={false}
            />
          </>
        }
      />
    </div>
  )
}

export function NetWorthSection() {
  return (
    <GallerySection id="net-worth" title="Net worth">
      <Specimen
        name="NetWorthDashboard, HideItemsButton"
        source="net-worth/net-worth-dashboard.tsx"
      >
        <DemoHub />
      </Specimen>
      <Specimen name="HubCard, missing rate" source="net-worth/hub-cards.tsx">
        <div className="w-full max-w-lg">
          <HubCard
            to="/net-worth/accounts"
            icon="wallet"
            title="Missing rate"
            detail="1 account"
            total={null}
            currency="CAD"
            converted
          />
        </div>
      </Specimen>
      <Specimen name="NetWorthBackLink" source="net-worth/back-link.tsx">
        <NetWorthBackLink />
      </Specimen>
    </GallerySection>
  )
}
