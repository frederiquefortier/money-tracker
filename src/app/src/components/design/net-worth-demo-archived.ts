import type { Holding } from '#/lib/holdings/holding'
import type {
  ChartItem,
  FlowRow,
  SeriesRow,
} from '#/lib/net-worth/net-worth-series'

// Invented figures: a TFSA held for a year and a half, emptied and archived in June 2024.

const ID = 'demo-old-tfsa'
const CLOSED_ON = '2024-06-30'

export const ARCHIVED_ITEM: ChartItem = {
  id: ID,
  closed: true,
  group: 'investments',
  type: 'holding',
  parts: {
    name: 'Old TFSA',
    typeFr: 'Old TFSA',
    typeEn: 'Old TFSA',
    institution: null,
    currency: 'CAD',
  },
}

// One value per month end, then 0 at the closing month end, as net_worth_series gives it.
export const ARCHIVED_SERIES: Array<SeriesRow> = Array.from(
  { length: 18 },
  (_, i) => ({
    onDate: new Date(Date.UTC(2023, i + 1, 0)).toISOString().slice(0, 10),
    kind: 'investment' as const,
    itemId: ID,
    displayValue: i === 17 ? '0' : String(2000 + i * 150),
  }),
)

export const ARCHIVED_FLOWS: Array<FlowRow> = [
  { onDate: '2023-01-10', holdingId: ID, displayAmount: '2000' },
  { onDate: '2024-06-20', holdingId: ID, displayAmount: '-4600' },
]

export const ARCHIVED_HOLDING: Holding = {
  id: ID,
  type: null,
  typeFr: 'Old TFSA',
  typeEn: 'Old TFSA',
  kind: 'investment',
  name: null,
  institutionId: null,
  country: 'CA',
  currency: 'CAD',
  openedOn: '2023-01-01',
  closedOn: CLOSED_ON,
  placed: '2000',
  withdrawn: '4600',
  latestOn: '2024-06-20',
  latestValue: '0',
  displayValue: '0',
  profit: '2600',
  profitPercent: '130',
  inUse: true,
}
