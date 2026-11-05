import { describe, expect, it } from 'vitest'
import {
  peopleErrors,
  peopleForKind,
  peopleInput,
  peoplePreview,
  withHeadCount,
  withPeople,
  withPeopleMode,
  withSource,
  withoutLine,
  withoutPeople,
} from './transaction-people'
import type { PersonLine } from './transaction-people'
import type { SplitMode, TransactionKind } from './transactions'

const ALEX = 'a4000000-0000-4000-8000-000000000001'
const SAM = 'a4000000-0000-4000-8000-000000000002'

const draft = (
  people: Array<PersonLine> = [],
  kind: TransactionKind = 'expense',
  peopleMode: SplitMode = 'share',
) => ({ kind, people, peopleMode })

const roles = (lines: ReadonlyArray<PersonLine> = []) =>
  lines.map((l) => [l.role, l.personId, l.value])

describe('withPeople', () => {
  it('starts an expense with Moi, everyone at one part, invited', () => {
    expect(roles(withPeople(draft(), [ALEX, SAM]).people)).toEqual([
      ['me', null, '1'],
      ['invited', ALEX, '1'],
      ['invited', SAM, '1'],
    ])
  })

  it('adds a person once', () => {
    const once = withPeople(draft(), [ALEX]).people ?? []
    expect(withPeople(draft(once), [ALEX]).people).toHaveLength(2)
  })
})

describe('removing', () => {
  const lines = withPeople(draft(), [ALEX, null]).people ?? []

  it('down to Moi alone removes the section', () => {
    const left = withoutPeople(draft(lines), [ALEX]).people ?? []
    const anonymous = left.find((l) => l.personId === null && l.role !== 'me')
    expect(withoutLine(draft(left), anonymous?.key ?? -1).people).toEqual([])
  })

  it('never removes Moi by key', () => {
    expect(withoutLine(draft(lines), lines[0].key).people).toHaveLength(3)
  })
})

describe('a line without a name', () => {
  it('in Parts, follows its count while untouched', () => {
    const lines = withPeople(draft(), [null]).people ?? []
    const line = lines[1]
    const grown = withHeadCount(draft(lines), line.key, 3).people ?? []
    expect([grown[1].headCount, grown[1].value]).toEqual([3, '3'])
  })
})

describe('peoplePreview', () => {
  it('lets Moi be zero in Montant', () => {
    const lines =
      withPeopleMode(draft(withPeople(draft(), [ALEX]).people), 'amount')
        .people ?? []
    const typed = lines.map((l) => ({
      ...l,
      value: l.role === 'me' ? '0' : '40',
    }))
    expect(
      peoplePreview(draft(typed, 'expense', 'amount'), 4000n, 'CAD'),
    ).toEqual({
      amounts: [0n, 4000n],
      remaining: 0n,
    })
  })

  it('shares the rounding to the last line', () => {
    const lines = withPeople(draft(), [ALEX, SAM]).people ?? []
    expect(peoplePreview(draft(lines), 10000n, 'CAD').amounts).toEqual([
      3333n,
      3333n,
      3334n,
    ])
  })

  it('asks for the whole amount in Montant', () => {
    const lines = (
      withPeople(draft([], 'expense', 'amount'), [ALEX]).people ?? []
    ).map((l) => ({ ...l, value: '10' }))
    expect(
      peopleErrors(draft(lines, 'expense', 'amount'), 'CAD', 4000n),
    ).toEqual({
      people: 'splitsSum',
    })
  })
})

describe('an income', () => {
  it('has one source, taking the whole amount', () => {
    expect(roles(withSource(ALEX).people)).toEqual([['from', ALEX, '1']])
    expect(withSource(null).people).toEqual([])
  })

  it('keeps the first named person when an expense becomes one, and back', () => {
    const lines = withPeople(draft(), [null, ALEX, SAM]).people ?? []
    const income = peopleForKind(draft(lines), 'income').people ?? []
    expect(roles(income)).toEqual([['from', ALEX, '1']])
    expect(
      roles(peopleForKind(draft(income, 'income'), 'expense').people),
    ).toEqual([
      ['me', null, '1'],
      ['invited', ALEX, '1'],
    ])
  })
})

describe('peopleInput', () => {
  it('sends Montant parts in the account currency', () => {
    const lines: Array<PersonLine> = [
      { key: 1, role: 'me', personId: null, headCount: 1, value: '0' },
      { key: 2, role: 'owes', personId: ALEX, headCount: 1, value: '12,5' },
    ]
    expect(peopleInput(draft(lines, 'expense', 'amount'), 'CAD')).toEqual([
      { role: 'me', personId: null, headCount: 1, value: '0.00' },
      { role: 'owes', personId: ALEX, headCount: 1, value: '12.50' },
    ])
  })
})
