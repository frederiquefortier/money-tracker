import { describe, expect, it } from 'vitest'
import { applyEdits, isDropped, NO_EDITS, REMOVED } from './import-edits'
import type { ImportInput } from './import'

const input: ImportInput = {
  files: [],
  accounts: [],
  transactions: [
    { ref: 't1', merchant: 'Train de Paris', note: 'Aller' },
    { ref: 't2', merchant: 'train de paris' },
    { ref: 't3', merchant: '?', event: 'Voyage' },
    { ref: 't4', merchant: 'Coop', event: 'Voyage', note: 'Courses' },
  ],
  splits: [],
  people: [
    { ref: 't1', role: 'invited', person: 'Club' },
    { ref: 't4', role: 'invited', person: 'Alex' },
  ],
  aliases: [],
  counterparties: [],
}

describe('applyEdits', () => {
  it('leaves the rows alone with no edit', () => {
    expect(applyEdits(input, NO_EDITS)).toBe(input)
  })

  it('puts a whole merchant in the note, in front of what the note says', () => {
    const rows = applyEdits(input, {
      ...NO_EDITS,
      merchants: {
        'train de paris': { name: '', note: 'Train de Paris' },
      },
    }).transactions
    expect(rows[0]).toMatchObject({
      merchant: '',
      note: 'Train de Paris - Aller',
    })
    expect(rows[1]).toMatchObject({ merchant: '', note: 'Train de Paris' })
    expect(rows[3]?.merchant).toBe('Coop')
  })

  it('renames a merchant and sends only part of its text to the note', () => {
    const rows = applyEdits(input, {
      ...NO_EDITS,
      merchants: { 'train de paris': { name: 'Train', note: 'de Paris' } },
    }).transactions
    expect(rows[0]).toMatchObject({
      merchant: 'Train',
      note: 'de Paris - Aller',
    })
    expect(rows[1]).toMatchObject({ merchant: 'Train', note: 'de Paris' })
  })

  it('removes a merchant without keeping its text', () => {
    const rows = applyEdits(input, {
      ...NO_EDITS,
      merchants: { '?': REMOVED },
    }).transactions
    expect(rows[2]).toMatchObject({ merchant: '', event: 'Voyage', note: '' })
  })

  it('unlinks an event and keeps the transaction', () => {
    const rows = applyEdits(input, {
      ...NO_EDITS,
      events: { voyage: REMOVED },
    }).transactions
    expect(rows[2]?.event).toBe('')
    expect(rows[3]).toMatchObject({
      merchant: 'Coop',
      event: '',
      note: 'Courses',
    })
  })

  it('removes a person from their lines, or renames them', () => {
    const removed = applyEdits(input, {
      ...NO_EDITS,
      people: { club: REMOVED },
    })
    expect(removed.people.map((p) => p.person)).toEqual(['Alex'])
    const renamed = applyEdits(input, {
      ...NO_EDITS,
      people: { club: { name: 'Book Club', note: '' } },
    })
    expect(renamed.people[0]?.person).toBe('Book Club')
  })

  it('adds a person put in the note to the transaction they were on', () => {
    const rows = applyEdits(input, {
      ...NO_EDITS,
      people: { club: { name: '', note: 'Club' } },
    })
    expect(rows.people).toHaveLength(1)
    expect(rows.transactions[0]).toMatchObject({ note: 'Club - Aller' })
  })
})

describe('isDropped', () => {
  it('is for an edit with no name', () => {
    expect(isDropped(REMOVED)).toBe(true)
    expect(isDropped({ name: 'Train', note: 'x' })).toBe(false)
    expect(isDropped(null)).toBe(false)
  })
})
