import { describe, expect, it } from 'vitest'
import {
  peopleErrors,
  peopleInput,
  peoplePreview,
} from '#/lib/transactions/transaction-people-draft'
import {
  withHeadCount,
  withPeople,
} from '#/lib/transactions/transaction-people'
import type { PersonLine } from '#/lib/transactions/transaction-people'

const ALEX = 'a4000000-0000-4000-8000-000000000001'

const draft = (people: Array<PersonLine> = []) => ({
  kind: 'expense' as const,
  people,
  peopleMode: 'share' as const,
})

describe('an invited person has no part', () => {
  const invited = (key: number, headCount = 1): PersonLine => ({
    key,
    role: 'invited',
    personId: key === 2 ? ALEX : null,
    headCount,
    value: '',
  })
  const me: PersonLine = {
    key: 1,
    role: 'me',
    personId: null,
    headCount: 1,
    value: '1',
  }

  it('leaves Moi the whole amount', () => {
    const lines = draft([me, invited(2)])
    expect(peoplePreview(lines, 4000n, 'CAD').amounts).toEqual([
      4000n,
      undefined,
    ])
    expect(peopleErrors(lines, 'CAD', 4000n)).toEqual({})
  })

  it('is sent with a part of 0 and keeps its count', () => {
    const input = peopleInput(
      draft([me, invited(2), invited(3, 4)]),
      'CAD',
      4000n,
    )
    expect(input.map((l) => [l.role, l.headCount, l.value])).toEqual([
      ['me', 1, '1'],
      ['invited', 1, '0'],
      ['invited', 4, '0'],
    ])
  })
})

describe('a line without a name', () => {
  it('counts its people and has no part', () => {
    const lines = withPeople(draft(), [null]).people ?? []
    const line = lines[1]
    const grown = withHeadCount(draft(lines), line.key, 3).people ?? []
    expect([grown[1].headCount, grown[1].value]).toEqual([3, ''])
  })
})
