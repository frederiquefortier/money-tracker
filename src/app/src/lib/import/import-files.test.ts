import { describe, expect, it } from 'vitest'
import { importFileName, importInputOf, readImportFile } from './import-files'

const header =
  'ref,date,account,institution,kind,amount,currency,original_amount,original_currency,merchant,event,status,transfer_group,note'

describe('importFileName', () => {
  it('knows the four files by name, whatever the case', () => {
    expect(importFileName('transactions.csv')).toBe('transactions')
    expect(importFileName(' People.CSV ')).toBe('people')
    expect(importFileName('Aliases.csv')).toBe('aliases')
    expect(importFileName('events.csv')).toBeNull()
    expect(importFileName('transactions.xlsx')).toBeNull()
  })
})

describe('readImportFile', () => {
  it('reads the rows with their line', () => {
    const file = readImportFile(
      'transactions',
      `${header}\nt1,2026-02-03,Chèque,,expense,-30.00,CAD,,,Marché,,,,\n`,
    )
    expect(file.errors).toEqual([])
    expect(file.rows).toHaveLength(1)
    expect(file.rows[0]).toMatchObject({
      line: '2',
      ref: 't1',
      account: 'Chèque',
      amount: '-30.00',
      merchant: 'Marché',
    })
  })

  it('refuses a column it does not know and asks for the ones it needs', () => {
    const file = readImportFile('splits', 'ref,montant\nt1,5\n')
    expect(file.errors.map((e) => [e.code, e.detail])).toEqual(
      expect.arrayContaining([
        ['column_unknown', 'montant'],
        ['column_missing', 'category'],
        ['column_missing', 'amount'],
      ]),
    )
  })

  it('accepts the columns in any order', () => {
    const file = readImportFile(
      'splits',
      'amount,category,ref\n-5.00,Épicerie,t1\n',
    )
    expect(file.errors).toEqual([])
    expect(file.rows[0]).toMatchObject({ ref: 't1', amount: '-5.00' })
  })

  it('names a comma as a decimal separator, with its line', () => {
    const file = readImportFile(
      'splits',
      'ref,category,amount\nt1,Épicerie,"-12,50"\n',
    )
    expect(file.errors).toEqual([
      { file: 'splits.csv', line: 2, code: 'decimal_format', detail: '-12,50' },
    ])
  })
})

describe('readImportFile formats', () => {
  it('checks dates are real dates', () => {
    const rows = ['accounts.csv']
    expect(rows).toHaveLength(1)
    const file = readImportFile(
      'accounts',
      'name,type,currency,opening_balance,opened_on\nA,checking,CAD,0.00,2026-02-30\nB,checking,CAD,0.00,03/02/2026\nC,checking,CAD,0.00,2026-02-28\n',
    )
    expect(file.errors.map((e) => [e.line, e.code])).toEqual([
      [2, 'date_format'],
      [3, 'date_format'],
    ])
  })

  it('wants a value where one is required, not where it is optional', () => {
    const file = readImportFile(
      'people',
      'ref,role,person,head_count,amount,reimburses\nt1,,Alex,,,\nt2,invited,,2,,\n',
    )
    expect(file.errors).toEqual([
      { file: 'people.csv', line: 2, code: 'value_required', detail: 'role' },
    ])
  })

  it('checks the head count is a whole number', () => {
    const file = readImportFile(
      'people',
      'ref,role,head_count\nt1,invited,1.5\n',
    )
    expect(file.errors[0]?.code).toBe('integer_format')
  })

  it('reports an empty file, a quote never closed and a row with too many cells', () => {
    expect(readImportFile('people', '').errors[0]?.code).toBe('file_empty')
    expect(
      readImportFile('people', 'ref,role\n"open,x').errors.map((e) => e.code),
    ).toContain('csv_unterminated')
    expect(
      readImportFile('people', 'ref,role\nt1,me,extra\n').errors.map(
        (e) => e.code,
      ),
    ).toContain('row_length')
  })
})

describe('importInputOf', () => {
  it('gathers the rows of the files read, by file', () => {
    const splits = readImportFile('splits', 'ref,category,amount\nt1,A,-5.00\n')
    const input = importInputOf([splits])
    expect(input.files).toEqual(['splits.csv'])
    expect(input.splits).toHaveLength(1)
    expect(input.transactions).toEqual([])
  })
})

describe('the aliases file', () => {
  it('needs a kind, a name and an alias', () => {
    const file = readImportFile('aliases', 'kind,name\nmerchant,Coop\n')
    expect(file.errors.map((e) => [e.code, e.detail])).toEqual([
      ['column_missing', 'alias'],
    ])
    expect(
      readImportFile('aliases', 'kind,name,alias\nmerchant,Coop,Coop QC\n')
        .errors,
    ).toEqual([])
  })
})
