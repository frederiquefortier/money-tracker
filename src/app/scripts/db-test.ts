// Runs the pgTAP files against the linked project without Docker (ADR-022). Each file
// already runs in a transaction it rolls back; this collects its TAP lines into a temp
// table so the query API, which returns only the last result, can hand them back.
import { execFileSync } from 'node:child_process'
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const TESTS = '../supabase/tests/database'
const TAP =
  /^select (?=(plan|ok|is|isnt|throws_ok|lives_ok|results_eq|is_empty)\(|\* from finish\(\))/gm

function collectTap(sql: string) {
  return sql
    .replace(TAP, 'insert into tap (line) select ')
    .replace(
      'create extension if not exists pgtap with schema extensions;\n',
      (line) =>
        line +
        'create temp table tap (n serial, line text);\n' +
        'grant all on tap to public;\ngrant all on sequence tap_n_seq to public;\n',
    )
    .replace(
      /rollback;\s*$/,
      'reset role;\nselect line from tap order by n;\nrollback;\n',
    )
}

// A file, not an argument: the CLI reads a leading `--` comment as a flag.
const workdir = mkdtempSync(join(tmpdir(), 'db-test-'))

function run(file: string) {
  const script = join(workdir, file)
  writeFileSync(script, collectTap(readFileSync(`${TESTS}/${file}`, 'utf8')))
  const out = execFileSync(
    'npx',
    [
      'supabase',
      '--workdir',
      '..',
      'db',
      'query',
      '--linked',
      '--output-format',
      'json',
      '-f',
      script,
    ],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 10_000_000,
    },
  )
  const json = JSON.parse(
    out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1),
  ) as {
    rows: Array<{ line: string }>
  }
  return json.rows.map((row) => row.line)
}

const files = readdirSync(TESTS)
  .filter((f) => f.endsWith('.test.sql'))
  .sort()
let failed = 0
for (const file of files) {
  const lines = run(file)
  const passed = lines.filter((l) => l.startsWith('ok ')).length
  const problems = lines.filter(
    (l) => l.startsWith('not ok') || l.startsWith('#'),
  )
  console.log(`${file}: ${passed} ok${problems.length ? '' : ` (${lines[0]})`}`)
  if (problems.length) {
    failed++
    console.log(problems.join('\n'))
  }
}
rmSync(workdir, { recursive: true })
process.exit(failed ? 1 : 0)
