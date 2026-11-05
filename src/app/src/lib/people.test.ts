import { describe, expect, it } from 'vitest'
import { initialOf, namesOf, takenNames } from './people'
import type { Person } from './people'

describe('initialOf', () => {
  it('takes the first letter, uppercase', () => {
    expect(initialOf('  élise', 'fr-CA')).toBe('É')
  })

  it('keeps a character outside the basic plane whole', () => {
    expect(initialOf('𝒜lex', 'fr-CA')).toBe('𝒜')
  })

  it('is empty for an empty name', () => {
    expect(initialOf('', 'fr-CA')).toBe('')
  })
})

describe('namesOf', () => {
  const groups = [
    { id: 'g1', name: 'Escalade' },
    { id: 'g2', name: 'Chorale' },
    { id: 'g3', name: 'Bureau' },
  ]

  it('names the chosen ones alphabetically', () => {
    expect(namesOf(['g1', 'g2'], groups, 'fr-CA')).toBe('Chorale, Escalade')
  })

  it('is empty when none is chosen', () => {
    expect(namesOf([], groups, 'fr-CA')).toBe('')
  })
})

describe('takenNames', () => {
  const person = (
    id: string,
    name: string,
    aliases: Array<string>,
  ): Person => ({
    id,
    name,
    archivedOn: null,
    groupIds: [],
    aliases,
    transactionCount: 0,
  })
  const people = [person('p1', 'Élise', ['Lili']), person('p2', 'Marco', [])]

  it("holds every other person's name and aliases, folded", () => {
    expect(takenNames(people, 'p2')).toEqual(new Set(['elise', 'lili']))
  })

  it('holds everyone for a new person', () => {
    expect(takenNames(people, undefined).has('marco')).toBe(true)
  })
})
