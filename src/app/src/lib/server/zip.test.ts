import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { zipFiles } from './zip.server'

const dir = mkdtempSync(join(tmpdir(), 'zip-test-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('zipFiles', () => {
  it('writes an archive unzip reads back', () => {
    const file = join(dir, 'export.zip')
    writeFileSync(
      file,
      zipFiles([
        { name: 'accounts.csv', text: 'name,currency\nChèque,CAD\n' },
        { name: 'splits.csv', text: 'ref,category,amount\n'.repeat(50) },
      ]),
    )
    execFileSync('unzip', ['-tq', file])
    expect(
      execFileSync('unzip', ['-p', file, 'accounts.csv'], { encoding: 'utf8' }),
    ).toBe('name,currency\nChèque,CAD\n')
    expect(execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' })).toBe(
      'accounts.csv\nsplits.csv\n',
    )
  })
})
