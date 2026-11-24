import { describe, expect, it } from 'vitest'
import { exportFiles } from './export-files'
import type { ExportData } from './export-files'
import { readImportFile } from './import-files'

const empty: ExportData = {
  accounts: [],
  transactions: [],
  splits: [],
  people: [],
  aliases: [],
  holdings: [],
  snapshots: [],
  contributions: [],
  holding_transfers: [],
}

describe('exportFiles', () => {
  it('writes only the files with rows, in the import columns', () => {
    const files = exportFiles({
      ...empty,
      accounts: [
        {
          name: 'Chèque',
          type: 'checking',
          currency: 'CAD',
          institution: null,
          institution_url: null,
          opening_balance: '10.5',
          opened_on: '2024-01-01',
          closed_on: null,
        },
      ],
    })
    expect(files).toEqual([
      {
        name: 'accounts.csv',
        text:
          'name,type,currency,institution,institution_url,opening_balance,opened_on,closed_on\n' +
          'Chèque,checking,CAD,,,10.5,2024-01-01,\n',
      },
    ])
  })

  it('writes files the import reads without a fault', () => {
    const [file] = exportFiles({
      ...empty,
      transactions: [
        {
          ref: 'e1',
          date: '2026-03-02',
          account: 'Chèque',
          kind: 'expense',
          amount: '-12.5',
          currency: 'CAD',
          merchant: 'Épicerie, Test',
          note: 'Souper "maison"\nà deux',
        },
      ],
    })
    const read = readImportFile('transactions', file.text)
    expect(read.errors).toEqual([])
    expect(read.rows[0]).toMatchObject({
      amount: '-12.5',
      merchant: 'Épicerie, Test',
      note: 'Souper "maison"\nà deux',
      event: '',
    })
  })

  it('leaves out the files not chosen', () => {
    const files = exportFiles(
      {
        ...empty,
        aliases: [{ kind: 'merchant', name: 'Épicerie', alias: 'EPIC' }],
        holdings: [{ holding: 'celi', type: 'CA_TFSA', currency: 'CAD' }],
      },
      ['holdings'],
    )
    expect(files.map((f) => f.name)).toEqual(['holdings.csv'])
  })
})
