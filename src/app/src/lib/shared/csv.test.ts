import { describe, expect, it } from 'vitest'
import { parseCsv } from './csv'

describe('parseCsv', () => {
  it('reads cells and records', () => {
    expect(parseCsv('a,b\n1,2\n').records).toEqual([
      { line: 1, cells: ['a', 'b'] },
      { line: 2, cells: ['1', '2'] },
    ])
  })

  it('keeps empty cells and a last record with no line break', () => {
    expect(parseCsv('a,b,c\n1,,').records[1]).toEqual({
      line: 2,
      cells: ['1', '', ''],
    })
  })

  it('reads CRLF and a byte order mark', () => {
    const file = parseCsv('﻿a,b\r\n1,2\r\n')
    expect(file.records.map((r) => r.cells)).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('reads quoted cells with commas, quotes and line breaks', () => {
    const file = parseCsv('a,b\n"x, y","say ""hi""\nbye"\nnext,1\n')
    expect(file.records[1].cells).toEqual(['x, y', 'say "hi"\nbye'])
    // The line after a cell that spans two lines is line 5 of the file.
    expect(file.records[2]).toEqual({ line: 4, cells: ['next', '1'] })
  })

  it('skips blank lines', () => {
    expect(parseCsv('a\n\n\nb\n').records.map((r) => r.line)).toEqual([1, 4])
  })

  it('says when a quote is never closed', () => {
    expect(parseCsv('a,b\n"open,1').unterminated).toBe(true)
    expect(parseCsv('a,b\n1,2').unterminated).toBe(false)
  })

  it('reads accents as they are', () => {
    expect(parseCsv('Épargne,Café\n').records[0].cells).toEqual([
      'Épargne',
      'Café',
    ])
  })
})
