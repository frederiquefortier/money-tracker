import { describe, expect, it } from 'vitest'
import { parseImportCheck, parseImportDone } from './import-response'

const counts = {
  transactions: 9,
  skipped: 0,
  splits: 6,
  people_lines: 3,
  transfers: 1,
  reimbursements: 1,
  aliases: 0,
}

describe('parseImportCheck', () => {
  it('reads a refusal with its errors', () => {
    const check = parseImportCheck({
      ok: false,
      error_count: 1,
      errors: [
        { file: 'splits.csv', line: 4, code: 'split_sign', detail: '5.00' },
      ],
    })
    expect(check).toEqual({
      ok: false,
      errorCount: 1,
      errors: [
        { file: 'splits.csv', line: 4, code: 'split_sign', detail: '5.00' },
      ],
    })
  })

  it('reads a summary', () => {
    const check = parseImportCheck({
      ok: true,
      dry_run: true,
      counts,
      will_create: {
        currencies: [],
        institutions: ['Banque Sud'],
        accounts: [{ name: 'Historique', institution: null }],
        account_changes: [
          { name: 'Chèque', institution: 'Banque Sud', opening_balance: 100 },
        ],
        categories: ['Sorties'],
        merchants: ['Café Mila'],
        counterparties: [],
        people: [],
        events: ['Voyage'],
      },
    })
    expect(check).toMatchObject({
      ok: true,
      nothingToImport: false,
      counts: { transactions: 9, peopleLines: 3 },
      willCreate: {
        institutions: ['Banque Sud'],
        accountChanges: [{ name: 'Chèque', institution: 'Banque Sud' }],
        events: ['Voyage'],
      },
    })
  })

  it('reads a file that is all in already', () => {
    expect(
      parseImportCheck({
        ok: true,
        nothing_to_import: true,
        counts: { ...counts, transactions: 0, skipped: 9 },
      }),
    ).toMatchObject({ ok: true, nothingToImport: true })
  })

  it('does not take anything else for an answer', () => {
    expect(parseImportCheck({ ok: true })).toBeNull()
    expect(parseImportCheck(null)).toBeNull()
    expect(parseImportCheck('x')).toBeNull()
  })
})

describe('parseImportDone', () => {
  it('reads the batch written', () => {
    expect(
      parseImportDone({
        ok: true,
        batch_id: 'b1',
        created: { transactions: 9, events: 1 },
        counts,
      }),
    ).toMatchObject({ ok: true, batchId: 'b1', created: { transactions: 9 } })
  })

  it('reads a refusal too', () => {
    expect(parseImportDone({ ok: false, error_count: 0, errors: [] })).toEqual({
      ok: false,
      errorCount: 0,
      errors: [],
    })
  })
})
