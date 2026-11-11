export type CsvRecord = {
  /** The line of the file the record starts on, counting the header as line 1. */
  line: number
  cells: Array<string>
}

export type CsvFile = {
  records: Array<CsvRecord>
  /** The file ends inside a quoted cell. */
  unterminated: boolean
}

type Reader = {
  records: Array<CsvRecord>
  cells: Array<string>
  cell: string
  quoted: boolean
  line: number
  recordLine: number
}

function endCell(r: Reader) {
  r.cells.push(r.cell)
  r.cell = ''
}

function endRecord(r: Reader) {
  endCell(r)
  if (r.cells.length > 1 || r.cells[0] !== '') {
    r.records.push({ line: r.recordLine, cells: r.cells })
  }
  r.cells = []
}

/** Inside a quoted cell; returns the index of the next character to read. */
function readQuoted(r: Reader, source: string, i: number) {
  const char = source[i]
  if (char !== '"') {
    if (char === '\n') r.line++
    r.cell += char
    return i + 1
  }
  if (source[i + 1] === '"') {
    r.cell += '"'
    return i + 2
  }
  r.quoted = false
  return i + 1
}

/** Outside a quoted cell; returns the index of the next character to read. */
function readPlain(r: Reader, source: string, i: number) {
  const char = source[i]
  if (char === '"' && r.cell === '') {
    r.quoted = true
  } else if (char === ',') {
    endCell(r)
  } else if (char === '\n' || char === '\r') {
    const crlf = char === '\r' && source[i + 1] === '\n'
    endRecord(r)
    r.line++
    r.recordLine = r.line
    return crlf ? i + 2 : i + 1
  } else {
    r.cell += char
  }
  return i + 1
}

/**
 * Reads a CSV file as RFC 4180 writes it: commas, a quoted cell may hold commas and line
 * breaks, and `""` is a quote inside one. A byte order mark and blank lines are ignored.
 */
export function parseCsv(text: string): CsvFile {
  const source = text.startsWith('﻿') ? text.slice(1) : text
  const reader: Reader = {
    records: [],
    cells: [],
    cell: '',
    quoted: false,
    line: 1,
    recordLine: 1,
  }
  for (let i = 0; i < source.length;) {
    i = reader.quoted
      ? readQuoted(reader, source, i)
      : readPlain(reader, source, i)
  }
  if (reader.quoted) return { records: reader.records, unterminated: true }
  if (reader.cell !== '' || reader.cells.length > 0) endRecord(reader)
  return { records: reader.records, unterminated: false }
}
