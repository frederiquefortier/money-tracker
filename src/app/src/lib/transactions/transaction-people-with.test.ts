import { describe, expect, it } from 'vitest'
import {
  withPeople,
  withRole,
  withRoleSwitched,
} from '#/lib/transactions/transaction-people'
import {
  peopleErrors,
  peopleInput,
  peoplePreview,
} from '#/lib/transactions/transaction-people-draft'
import type { PersonLine } from '#/lib/transactions/transaction-people'

const ALEX = 'a4000000-0000-4000-8000-000000000001'
const SAM = 'a4000000-0000-4000-8000-000000000002'

const draft = (people: Array<PersonLine> = []) => ({
  kind: 'expense' as const,
  people,
  peopleMode: 'share' as const,
})

describe('someone with me (PPL-08)', () => {
  const withSam = () => {
    const lines = withPeople(draft(), [ALEX, SAM]).people ?? []
    const owes = withRoleSwitched(draft(lines), lines[2].key).people ?? []
    return withRoleSwitched(draft(owes), lines[2].key).people ?? []
  }

  it('is the third turn of the role tap, then back to invited', () => {
    const lines = withSam()
    expect(lines[2].role).toBe('with')
    expect(withRoleSwitched(draft(lines), lines[2].key).people?.[2].role).toBe(
      'invited',
    )
  })

  it('is skipped for a line without a name, which counts people', () => {
    const lines = withPeople(draft(), [null]).people ?? []
    const owes = withRoleSwitched(draft(lines), lines[1].key).people ?? []
    expect(withRoleSwitched(draft(owes), lines[1].key).people?.[1].role).toBe(
      'invited',
    )
  })

  it('takes no part: the others share the whole amount', () => {
    const lines = withSam()
    expect(peoplePreview(draft(lines), 9000n, 'CAD')).toMatchObject({
      amounts: [4500n, 4500n, undefined],
      remaining: 0n,
    })
    expect(peopleErrors(draft(lines), 'CAD', 9000n)).toEqual({})
  })

  it('is sent with no value, after the lines with a part', () => {
    const input = peopleInput(draft(withSam()), 'CAD', 9000n)
    expect(input.map((l) => l.role)).toEqual(['me', 'invited', 'with'])
    expect(input[2]).toMatchObject({ value: '0', headCount: 1 })
  })
})

describe('withRole', () => {
  it('sets the chosen role, and refuses with me for a line without a name', () => {
    const named = withPeople(draft(), [SAM]).people ?? []
    expect(withRole(draft(named), named[1].key, 'with').people?.[1].role).toBe(
      'with',
    )
    const unnamed = withPeople(draft(), [null]).people ?? []
    expect(
      withRole(draft(unnamed), unnamed[1].key, 'with').people?.[1].role,
    ).toBe('invited')
  })
})
