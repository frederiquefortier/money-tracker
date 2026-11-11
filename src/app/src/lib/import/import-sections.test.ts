import { describe, expect, it } from 'vitest'
import { buildSections, mergeOptions } from './import-sections'
import { EMPTY_WILL_CREATE } from './import'
import { NO_DECISIONS, NO_MERGES } from './import-merges'
import type { ImportInput } from './import'

const input: ImportInput = {
  files: [],
  accounts: [
    {
      name: 'Chèque',
      institution: 'Banque Sud',
      currency: 'CAD',
      opening_balance: '958.82',
      opened_on: '2022-12-31',
    },
  ],
  transactions: [
    { ref: 't1', merchant: 'Café Mila' },
    { ref: 't2', merchant: 'Café Mila' },
  ],
  splits: [{ ref: 't1', category: 'Sorties > Bars', amount: '-5.00' }],
  people: [],
  aliases: [],
  counterparties: [],
}

function sectionOf(sections: ReturnType<typeof buildSections>, key: string) {
  const found = sections.find((s) => s.key === key)
  if (!found) throw new Error(`No section ${key}`)
  return found
}

const will = {
  ...EMPTY_WILL_CREATE,
  accountChanges: [{ name: 'Chèque', institution: 'Banque Sud' }],
  categories: ['Sorties', 'Sorties > Bars'],
  merchants: ['Café Mila', 'Mila Café'],
}

describe('buildSections', () => {
  it('lists only what there is, in order, with how many rows use each', () => {
    const sections = buildSections(will, input, NO_DECISIONS)
    expect(sections.map((s) => s.key)).toEqual([
      'accountChanges',
      'categories',
      'merchants',
    ])
    expect(
      sectionOf(sections, 'merchants').items.map((i) => [i.label, i.uses]),
    ).toEqual([
      ['Café Mila', 2],
      ['Mila Café', 0],
    ])
    expect(sectionOf(sections, 'categories').items[0].uses).toBe(1)
  })

  it('gives an account its opening balance from the file', () => {
    const sections = buildSections(will, input, NO_DECISIONS)
    expect(sectionOf(sections, 'accountChanges').items[0]).toMatchObject({
      label: 'Chèque (Banque Sud)',
      uses: null,
      opening: { balance: '958.82', currency: 'CAD', openedOn: '2022-12-31' },
    })
  })

  it('counts what is left to create after the merges', () => {
    const merchants = sectionOf(
      buildSections(will, input, {
        ...NO_DECISIONS,
        merges: { ...NO_MERGES, merchants: { 'mila cafe': 'Café Mila' } },
      }),
      'merchants',
    )
    expect(merchants.count).toBe(1)
    expect(merchants.items[1].mergedInto).toBe('Café Mila')
  })
})

describe('mergeOptions', () => {
  const targets = {
    categories: [],
    merchants: ['Coop'],
    people: [],
    events: [],
  }

  it('offers the names that exist and the other new ones, not itself', () => {
    const merchants = sectionOf(
      buildSections(will, input, NO_DECISIONS),
      'merchants',
    )
    expect(mergeOptions(merchants, merchants.items[0], targets)).toEqual([
      'Coop',
      'Mila Café',
    ])
  })

  it('offers nothing for a kind that cannot be merged', () => {
    const changes = sectionOf(
      buildSections(will, input, NO_DECISIONS),
      'accountChanges',
    )
    expect(mergeOptions(changes, changes.items[0], targets)).toEqual([])
  })
})
