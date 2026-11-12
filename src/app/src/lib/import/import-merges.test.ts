import { describe, expect, it } from 'vitest'
import {
  applyMerges,
  mergeAliasRows,
  NO_DECISIONS,
  NO_MERGES,
  usageCounts,
  withDecisions,
} from './import-merges'
import { foldName, foldPath } from './import-names'
import type { ImportInput } from './import'

const input: ImportInput = {
  files: [],
  accounts: [],
  transactions: [
    { ref: 't1', merchant: 'Café Mila', event: 'Voyage test' },
    { ref: 't2', merchant: 'cafe mila' },
    { ref: 't3', merchant: 'Autre' },
  ],
  splits: [
    { ref: 't1', category: 'Sorties > Bars', amount: '-5.00' },
    { ref: 't2', category: 'Sorties > Restaurants', amount: '-9.00' },
    { ref: 't3', category: 'Taxi', amount: '-3.00' },
  ],
  people: [{ ref: 't1', role: 'invited', person: 'Antoine' }],
  aliases: [],
  counterparties: [],
  holdings: [],
  snapshots: [],
  contributions: [],
  holding_transfers: [],
}

describe('foldName', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(foldName('  Café   MILA ')).toBe('cafe mila')
    expect(foldPath('Sorties>  Bars')).toBe('sorties > bars')
  })
})

describe('applyMerges', () => {
  it('leaves the rows alone with no merge', () => {
    expect(applyMerges(input, NO_MERGES)).toBe(input)
  })

  it('renames a merchant wherever it is written, and only it', () => {
    const merged = applyMerges(input, {
      ...NO_MERGES,
      merchants: { 'cafe mila': 'Mila Café' },
    })
    expect(merged.transactions.map((t) => t.merchant)).toEqual([
      'Mila Café',
      'Mila Café',
      'Autre',
    ])
    expect(merged.splits).toEqual(input.splits)
  })

  it('renames an event and a person', () => {
    const merged = applyMerges(input, {
      ...NO_MERGES,
      events: { 'voyage test': 'Voyage' },
      people: { antoine: 'Antoine 2' },
    })
    expect(merged.transactions[0]?.event).toBe('Voyage')
    expect(merged.people[0]?.person).toBe('Antoine 2')
  })

  it('carries what is under a merged category with it', () => {
    const merged = applyMerges(input, {
      ...NO_MERGES,
      categories: { sorties: 'Loisirs', taxi: 'Transport > Auto' },
    })
    expect(merged.splits.map((s) => s.category)).toEqual([
      'Loisirs > Bars',
      'Loisirs > Restaurants',
      'Transport > Auto',
    ])
  })

  it('takes the deepest merge first', () => {
    const merged = applyMerges(input, {
      ...NO_MERGES,
      categories: { sorties: 'Loisirs', 'sorties > bars': 'Santé > Pharmacie' },
    })
    expect(merged.splits[0]?.category).toBe('Santé > Pharmacie')
    expect(merged.splits[1]?.category).toBe('Loisirs > Restaurants')
  })

  it('follows a chain and stops on a loop', () => {
    const chain = applyMerges(input, {
      ...NO_MERGES,
      merchants: { autre: 'B', b: 'C' },
    })
    expect(chain.transactions[2]?.merchant).toBe('C')
    const loop = applyMerges(input, {
      ...NO_MERGES,
      merchants: { autre: 'B', b: 'Autre' },
    })
    expect(loop.transactions[2]?.merchant).toBeTypeOf('string')
  })
})

describe('usageCounts', () => {
  it('counts the rows that use each name, a category with everything under it', () => {
    const counts = usageCounts(input)
    expect(counts.merchants.get('cafe mila')).toBe(2)
    expect(counts.categories.get('sorties')).toBe(2)
    expect(counts.categories.get('sorties > bars')).toBe(1)
    expect(counts.people.get('antoine')).toBe(1)
    expect(counts.events.get('voyage test')).toBe(1)
  })
})

describe('mergeAliasRows', () => {
  const will = { merchants: ['Café Mila', 'Mila Café'], people: ['Antoine'] }

  it('keeps the spelling merged away as an alias of what it went into', () => {
    expect(
      mergeAliasRows(will, {
        ...NO_MERGES,
        merchants: { 'mila cafe': 'Café Mila' },
        people: { antoine: 'Antoine 2' },
      }),
    ).toEqual([
      { kind: 'merchant', name: 'Café Mila', alias: 'Mila Café' },
      { kind: 'person', name: 'Antoine 2', alias: 'Antoine' },
    ])
  })

  it('gives the end of a chain, and nothing for what is not merged', () => {
    expect(mergeAliasRows(will, NO_MERGES)).toEqual([])
    expect(
      mergeAliasRows(
        { merchants: ['A'], people: [] },
        { ...NO_MERGES, merchants: { a: 'B', b: 'C' } },
      ),
    ).toEqual([{ kind: 'merchant', name: 'C', alias: 'A' }])
  })
})

describe('withDecisions', () => {
  it('renames the rows and adds the aliases to those the file gave', () => {
    const merged = withDecisions(
      {
        ...input,
        aliases: [{ kind: 'merchant', name: 'Autre', alias: 'Au.' }],
      },
      { merchants: ['Mila Café'], people: [] },
      {
        ...NO_DECISIONS,
        merges: { ...NO_MERGES, merchants: { 'mila cafe': 'Café Mila' } },
      },
    )
    expect(merged.aliases).toEqual([
      { kind: 'merchant', name: 'Autre', alias: 'Au.' },
      { kind: 'merchant', name: 'Café Mila', alias: 'Mila Café' },
    ])
  })
})

describe('withDecisions and the file aliases', () => {
  const will = { merchants: ['La Signature'], people: [] }
  const file = {
    ...input,
    aliases: [
      { kind: 'merchant', name: 'La Signature', alias: 'Le Signature' },
    ],
  }

  it('drops an alias that a merge made the name itself', () => {
    const merged = withDecisions(file, will, {
      ...NO_DECISIONS,
      merges: { ...NO_MERGES, merchants: { 'la signature': 'Le Signature' } },
    })
    expect(merged.aliases).toEqual([
      { kind: 'merchant', name: 'Le Signature', alias: 'La Signature' },
    ])
  })

  it('sends the merchants said to be a person as counterparties', () => {
    const merged = withDecisions(file, will, {
      ...NO_DECISIONS,
      persons: { claire: 'Claire' },
    })
    expect(merged.counterparties).toEqual([{ name: 'Claire' }])
  })

  it('keeps a note with a merge', () => {
    const merged = withDecisions(input, will, {
      ...NO_DECISIONS,
      merges: { ...NO_MERGES, merchants: { 'cafe mila': 'Mila Café' } },
      edits: {
        merchants: { 'cafe mila': { name: 'Café Mila', note: 'Dépanneur' } },
        people: {},
        events: {},
      },
    })
    expect(merged.transactions[0]).toMatchObject({
      merchant: 'Mila Café',
      note: 'Dépanneur',
    })
  })
})
