import { describe, expect, it } from 'vitest'
import { stageOf, stepState } from './import-stage'
import type { ImportCheck } from './import'

const good: ImportCheck = {
  ok: true,
  nothingToImport: false,
  willCreate: {
    currencies: [],
    institutions: [],
    accounts: [],
    accountChanges: [],
    categories: [],
    merchants: [],
    counterparties: [],
    people: [],
    events: [],
    holdings: [],
  },
  counts: {
    transactions: 1,
    skipped: 0,
    splits: 1,
    peopleLines: 0,
    transfers: 0,
    reimbursements: 0,
    aliases: 0,
    holdings: 0,
    holdingsMatched: 0,
    snapshots: 0,
    contributions: 0,
    holdingTransfers: 0,
    holdingRowsSkipped: 0,
  },
}
const bad: ImportCheck = { ok: false, errors: [], errorCount: 1 }

describe('stageOf', () => {
  it('stays on the files until a check passes, then the summary, then done', () => {
    expect(stageOf({ done: false, check: null })).toBe('files')
    expect(stageOf({ done: false, check: bad })).toBe('files')
    expect(stageOf({ done: false, check: good })).toBe('import')
    expect(stageOf({ done: true, check: good })).toBe('done')
  })
})

describe('stepState', () => {
  it('has the steps before the stage done, the stage active, the rest to do', () => {
    expect([0, 1].map((i) => stepState(i, 'files'))).toEqual(['active', 'todo'])
    expect([0, 1].map((i) => stepState(i, 'import'))).toEqual([
      'done',
      'active',
    ])
    expect([0, 1].map((i) => stepState(i, 'done'))).toEqual(['done', 'done'])
  })
})
