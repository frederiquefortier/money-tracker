import type { AccountsPage } from '#/lib/accounts/account'
import type { Holding, HoldingsPage } from '#/lib/holdings/holding'
import type { ChartItem, SeriesRow } from '#/lib/net-worth/net-worth-series'

// Invented figures: three years of month ends for a few accounts and holdings.

type DemoHolding = {
  id: string
  group: ChartItem['group']
  name: string
  institution: string | null
}

const holding = ({ id, group, name, institution }: DemoHolding): ChartItem => ({
  id,
  closed: false,
  group,
  type: 'holding',
  parts: {
    name,
    typeFr: name,
    typeEn: name,
    institution,
    currency: 'CAD',
  },
})

export const ITEMS: Array<ChartItem> = [
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
  holding({
    id: 'demo-rrsp',
    group: 'investments',
    name: 'RRSP',
    institution: 'Demo Broker',
  }),
  holding({
    id: 'demo-tfsa',
    group: 'investments',
    name: 'TFSA',
    institution: 'Demo Broker',
  }),
  holding({
    id: 'demo-house',
    group: 'assets',
    name: 'House',
    institution: null,
  }),
  holding({
    id: 'demo-mortgage',
    group: 'debts',
    name: 'Mortgage',
    institution: 'Demo Bank',
  }),
  holding({
    id: 'demo-loan',
    group: 'debts',
    name: 'Car loan',
    institution: 'Demo Bank',
  }),
  holding({ id: 'demo-art', group: 'assets', name: 'Art', institution: null }),
]

type Demo = [ChartItem['id'], SeriesRow['kind'], (i: number) => number]

const DEMO: Array<Demo> = [
  ['demo-chq', 'account', (i) => 3000 + ((i * 370) % 1900)],
  ['demo-rrsp', 'investment', (i) => 40000 + i * 900],
  ['demo-house', 'asset', (i) => 300000 + i * 1500],
]

export const SERIES: Array<SeriesRow> = Array.from({ length: 36 }, (_, i) => {
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

const BANK = {
  id: 'demo-bank',
  name: 'Demo Bank',
  websiteUrl: 'https://example.com',
}
const BROKER = { id: 'demo-broker', name: 'Demo Broker', websiteUrl: null }

type Account = AccountsPage['accounts'][number]

const account = ({
  id,
  name,
  type,
  balance,
}: Pick<Account, 'id' | 'name' | 'type' | 'balance'>): Account => ({
  id,
  name,
  type,
  currency: 'CAD',
  institutionId: BANK.id,
  openingBalance: '0',
  openedOn: '2023-01-01',
  closedOn: null,
  hiddenForNew: false,
  balance,
  pending: '0',
  displayBalance: balance,
  inUse: true,
})

/** The accounts as the hub loads them, at the series' last month end. */
export const ACCOUNTS_PAGE: AccountsPage = {
  accounts: [
    {
      ...account({
        id: 'demo-chq',
        name: 'Chequing',
        type: 'checking',
        balance: '4550',
      }),
      pending: '-120',
    },
    account({
      id: 'demo-visa',
      name: 'Visa',
      type: 'credit_card',
      balance: '-850',
    }),
  ],
  institutions: [BANK, BROKER],
  types: [
    { code: 'checking', labelFr: 'Chèque', labelEn: 'Chequing' },
    { code: 'credit_card', labelFr: 'Carte de crédit', labelEn: 'Credit card' },
  ],
}

type DemoValue = Pick<Holding, 'id' | 'kind' | 'institutionId'> & {
  name: string
  value: string
}

const holdingOf = ({
  id,
  kind,
  name,
  value,
  institutionId,
}: DemoValue): Holding => ({
  id,
  type: null,
  typeFr: name,
  typeEn: name,
  kind,
  name: null,
  institutionId,
  country: 'CA',
  currency: 'CAD',
  openedOn: '2023-01-01',
  closedOn: null,
  placed: kind === 'investment' ? '60000' : null,
  withdrawn: null,
  latestOn: '2025-12-31',
  latestValue: value,
  displayValue: value,
  profit: null,
  profitPercent: null,
  inUse: true,
})

/** The holdings as the hub loads them, an investment with its profit. */
export const HOLDINGS_PAGE: HoldingsPage = {
  holdings: [
    {
      ...holdingOf({
        id: 'demo-rrsp',
        kind: 'investment',
        name: 'RRSP',
        value: '71500',
        institutionId: BROKER.id,
      }),
      profit: '11500',
      profitPercent: '19.17',
    },
    holdingOf({
      id: 'demo-tfsa',
      kind: 'investment',
      name: 'TFSA',
      value: '18800',
      institutionId: BROKER.id,
    }),
    holdingOf({
      id: 'demo-house',
      kind: 'asset',
      name: 'House',
      value: '352500',
      institutionId: null,
    }),
    holdingOf({
      id: 'demo-mortgage',
      kind: 'debt',
      name: 'Mortgage',
      value: '201500',
      institutionId: BANK.id,
    }),
    // A debt paid off: 0, not red.
    holdingOf({
      id: 'demo-loan',
      kind: 'debt',
      name: 'Car loan',
      value: '0',
      institutionId: BANK.id,
    }),
    // No value yet: shown at 0.
    {
      ...holdingOf({
        id: 'demo-art',
        kind: 'asset',
        name: 'Art',
        value: '0',
        institutionId: null,
      }),
      latestOn: null,
      latestValue: null,
      displayValue: null,
    },
  ],
  institutions: [BANK, BROKER],
  types: [],
  unlinkedCount: 0,
  investmentCategoryIds: [],
}
