import { describe, expect, it } from 'vitest'
import {
  withHeadCount,
  withPeople,
  withPeopleMode,
  withRoleSwitched,
  withoutLine,
  withoutPeople,
} from './transaction-people'
import {
  peopleErrors,
  typedLeft,
  peopleInput,
  peoplePreview,
} from './people-parts'
import {
  ANONYMOUS,
  peopleForKind,
  sourceOf,
  withSource,
} from './transaction-source'
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
    ).toMatchObject({
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
  it('can come from someone without a name', () => {
    const anonymous = withSource(ANONYMOUS).people ?? []
    expect(roles(anonymous)).toEqual([['from', null, '1']])
    expect(sourceOf({ people: anonymous })).toBe(ANONYMOUS)
  })

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

describe('an empty Me doit part (spec 21)', () => {
  it('starts empty when the line becomes Me doit', () => {
    const lines = withPeople(draft(), [SAM]).people ?? []
    const owes = withRoleSwitched(draft(lines), lines[1].key).people ?? []
    expect(owes[1].value).toBe('')
  })

  it('in Parts, sits outside the split: the others share the whole amount', () => {
    const lines = withPeople(draft(), [ALEX, SAM]).people ?? []
    const owes = withRoleSwitched(draft(lines), lines[2].key).people ?? []
    expect(peoplePreview(draft(owes), 9000n, 'CAD')).toMatchObject({
      amounts: [4500n, 4500n, undefined],
      remaining: 0n,
    })
    expect(peopleInput(draft(owes), 'CAD', 9000n)[2]).toMatchObject({
      amountUnknown: true,
    })
  })

  it('in Montant too, Moi taking the rest until the reimbursement (Moi typed or not)', () => {
    const lines: Array<PersonLine> = [
      { key: 1, role: 'me', personId: null, headCount: 1, value: '30' },
      { key: 2, role: 'owes', personId: SAM, headCount: 1, value: '' },
    ]
    const montant = draft(lines, 'expense', 'amount')
    expect(peoplePreview(montant, 9000n, 'CAD')).toMatchObject({
      amounts: [9000n, undefined],
      remaining: 0n,
    })
    expect(peopleInput(montant, 'CAD', 9000n)).toMatchObject([
      { role: 'me', value: '90.00', fillsRest: false },
      { role: 'owes', amountUnknown: true },
    ])
  })
})

describe('an empty field never stops the save', () => {
  const line = (key: number, role: PersonLine['role'], value: string) => ({
    key,
    role,
    personId: role === 'me' ? null : ALEX,
    headCount: 1,
    value,
  })

  it('in Montant, empty lines share what the typed ones leave, Moi included', () => {
    const montant = draft(
      [line(1, 'me', ''), line(2, 'invited', '30')],
      'expense',
      'amount',
    )
    expect(peoplePreview(montant, 9000n, 'CAD')).toMatchObject({
      amounts: [6000n, 3000n],
      remaining: 0n,
    })
    expect(peopleErrors(montant, 'CAD', 9000n)).toEqual({})
  })

  it('in %, empty lines share the percentage left', () => {
    const percent = draft(
      [line(1, 'me', ''), line(2, 'invited', '25')],
      'expense',
      'percent',
    )
    expect(peoplePreview(percent, 8000n, 'CAD').amounts).toEqual([6000n, 2000n])
    expect(peopleInput(percent, 'CAD', 8000n)[0].value).toBe('75.0000')
  })

  it('in Parts, an empty line counts one part', () => {
    const parts = draft([line(1, 'me', ''), line(2, 'invited', '1')])
    expect(peoplePreview(parts, 1000n, 'CAD').amounts).toEqual([500n, 500n])
  })

  it('counts only the typed lines in what is left to share, as % does', () => {
    const montant = draft(
      [line(1, 'me', ''), line(2, 'invited', '30')],
      'expense',
      'amount',
    )
    expect(typedLeft(montant, 9000n, 'CAD')).toBe(6000n)
  })

  it('says the typed lines take everything when nothing is left', () => {
    const montant = draft(
      [line(1, 'me', ''), line(2, 'invited', '90')],
      'expense',
      'amount',
    )
    expect(peopleErrors(montant, 'CAD', 9000n)).toEqual({ people: 'splitsSum' })
  })
})

describe('peopleInput', () => {
  it('sends Montant parts in the account currency', () => {
    const lines: Array<PersonLine> = [
      {
        key: 1,
        role: 'me',
        personId: null,
        headCount: 1,
        value: '0',
      },
      {
        key: 2,
        role: 'owes',
        personId: ALEX,
        headCount: 1,
        value: '12,5',
      },
    ]
    expect(
      peopleInput(draft(lines, 'expense', 'amount'), 'CAD', 1250n),
    ).toEqual([
      {
        role: 'me',
        personId: null,
        headCount: 1,
        amountUnknown: false,
        fillsRest: false,
        value: '0.00',
      },
      {
        role: 'owes',
        personId: ALEX,
        headCount: 1,
        amountUnknown: false,
        fillsRest: false,
        value: '12.50',
      },
    ])
  })
})
