import { describe, expect, it } from 'vitest'
import {
  ACCOUNTS_PAGE,
  HOLDINGS_PAGE,
  ITEMS,
} from '#/components/design/net-worth-demo'
import {
  closedEntries,
  entryComparator,
  groupEntries,
  groupWorth,
  netWorthEntries,
} from '#/lib/net-worth/net-worth-list'
import type {
  NetWorthEntry,
  NetWorthSort,
} from '#/lib/net-worth/net-worth-list'

const entries = netWorthEntries({
  accounts: ACCOUNTS_PAGE,
  holdings: HOLDINGS_PAGE,
  items: ITEMS,
  locale: 'en',
})
const byId = (id: string) => entries.find((e) => e.id === id)

describe('netWorthEntries', () => {
  it('reads a credit card as owed, and counts it negative', () => {
    expect(byId('demo-visa')).toMatchObject({
      group: 'debts',
      value: '850',
      worth: '-850',
    })
  })
  it('reads a credit card in credit as negative owed, and counts it positive', () => {
    const [entry] = netWorthEntries({
      accounts: {
        ...ACCOUNTS_PAGE,
        accounts: [
          {
            ...ACCOUNTS_PAGE.accounts[1],
            balance: '235.63',
            displayBalance: '235.63',
          },
        ],
      },
      holdings: { ...HOLDINGS_PAGE, holdings: [] },
      items: ITEMS,
      locale: 'en',
    })
    expect(entry).toMatchObject({ value: '-235.63', worth: '235.63' })
  })
  it('counts a debt holding negative and shows it owed', () => {
    expect(byId('demo-mortgage')).toMatchObject({
      value: '201500',
      worth: '-201500',
    })
  })
  it('names an item with its institution, and without inside it', () => {
    expect(byId('demo-chq')).toMatchObject({
      label: 'Chequing (Demo Bank)',
      shortLabel: 'Chequing',
    })
  })
  it('shows a holding with no value yet at 0, adding nothing', () => {
    const [entry] = netWorthEntries({
      accounts: { ...ACCOUNTS_PAGE, accounts: [] },
      holdings: {
        ...HOLDINGS_PAGE,
        holdings: [
          {
            ...HOLDINGS_PAGE.holdings[0],
            latestOn: null,
            latestValue: null,
            displayValue: null,
          },
        ],
      },
      items: ITEMS,
      locale: 'en',
    })
    expect(entry).toMatchObject({ value: '0.0000', worth: '0.0000' })
  })
})

describe('entryComparator', () => {
  const one = (label: string, worth: string | null) =>
    ({ label, worth, typeText: 'RRSP', currency: 'CAD' }) as NetWorthEntry
  const order = (sort: NetWorthSort) =>
    [one('B', '500'), one('A', null), one('C', '900'), one('D', '-300')]
      .sort(entryComparator(sort, 'fr', (e) => e.label))
      .map((e) => e.label)
  it('sorts by value, a debt below zero, a missing rate last', () => {
    expect(order('valueAsc')).toEqual(['D', 'B', 'C', 'A'])
    expect(order('valueDesc')).toEqual(['C', 'B', 'D', 'A'])
  })
  it('sorts by name', () => {
    expect(order('name')).toEqual(['A', 'B', 'C', 'D'])
  })
})

describe('groupEntries', () => {
  const options = {
    sort: 'name' as const,
    locale: 'en',
    institutions: ACCOUNTS_PAGE.institutions,
  }
  it('groups by type in the chart order', () => {
    const groups = groupEntries(entries, { ...options, by: 'type' })
    expect(groups.map((g) => g.key)).toEqual([
      'accounts',
      'investments',
      'assets',
      'debts',
    ])
    expect(groups[3]?.entries.map((e) => e.id)).toEqual([
      'demo-loan',
      'demo-mortgage',
      'demo-visa',
    ])
  })
  it('groups by institution A to Z, then the items with none', () => {
    const groups = groupEntries(entries, { ...options, by: 'institution' })
    expect(groups.map((g) => g.key)).toEqual(['demo-bank', 'demo-broker', ''])
    expect(groups[0]?.entries.map((e) => e.shortLabel)).toEqual([
      'Car loan',
      'Chequing',
      'Mortgage',
      'Visa',
    ])
  })
  it('leaves the archived items out of the groups', () => {
    const closed = entries.map((e) =>
      e.id === 'demo-house' ? { ...e, closedOn: '2025-06-30' } : e,
    )
    const groups = groupEntries(closed, { ...options, by: 'type' })
    const assets = groups.find((g) => g.key === 'assets')
    expect(assets?.entries.map((e) => e.id)).toEqual(['demo-art'])
    expect(closedEntries(closed, 'en').map((e) => e.id)).toEqual(['demo-house'])
  })
})

describe('groupWorth', () => {
  const debts = entries.filter((e) => e.group === 'debts')
  it('adds what the group is worth, debts negative', () => {
    expect(groupWorth(debts, new Set())).toBe('-202350.0000')
  })
  it('leaves the hidden items out', () => {
    expect(groupWorth(debts, new Set(['demo-mortgage']))).toBe('-850.0000')
  })
  it('gives null when a rate is missing', () => {
    const missing = debts.map((e) => ({ ...e, worth: null }))
    expect(groupWorth(missing, new Set())).toBeNull()
  })
})
