import { foldName } from '#/lib/import/import-names'

function distance(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let smallest = i
    for (let j = 1; j <= b.length; j++) {
      const cost = Math.min(
        (previous[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      row[j] = cost
      if (cost < smallest) smallest = cost
    }
    // Every cell of a row only grows from here: past the limit, stop.
    if (smallest > limit) return limit + 1
    previous = row
  }
  return previous[b.length] ?? limit + 1
}

const ARTICLES = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'the', 'el'])

/** Folded, with "&" and "and" read as "et": "Ben & Flo" is "Ben et Flo". */
function normal(name: string) {
  return foldName(name)
    .replace(/&/g, ' et ')
    .replace(/\band\b/g, ' et ')
    .replace(/\s+/g, ' ')
    .trim()
}

function words(folded: string) {
  const all = folded.split(/[^a-z0-9]+/).filter(Boolean)
  return all.length > 1 && ARTICLES.has(all[0] ?? '') ? all.slice(1) : all
}

type Prepared = {
  name: string
  /** Folded only: two names equal here are the same name. */
  plain: string
  folded: string
  words: Array<string>
  /** The words after the article, as one string. */
  key: string
}

function prepare(name: string): Prepared {
  const folded = normal(name)
  const list = words(folded)
  return {
    name,
    plain: foldName(name),
    folded,
    words: list,
    key: list.join(' '),
  }
}

/** One name is the other with words added: "Bati" and "Bati Bassac", "Le Subtil" and "Subtil". */
function containsWords(a: Prepared, b: Prepared) {
  const [short, long] = a.words.length <= b.words.length ? [a, b] : [b, a]
  if (short.key.length < 4 || long.key === short.key)
    return short.key === long.key && short.key.length >= 4
  return (
    long.key.startsWith(`${short.key} `) || long.key.endsWith(` ${short.key}`)
  )
}

/** One name begins the other, and is long enough not to be chance: "Dollo", "Dollorama". */
function isPrefix(a: Prepared, b: Prepared) {
  const [short, long] = a.folded.length <= b.folded.length ? [a, b] : [b, a]
  return short.folded.length >= 5 && long.folded.startsWith(short.folded)
}

/**
 * A finder of the candidate a new name most likely means (IMP-06): the same name written
 * another way ("&" for "et"), one typo away (two for a long name), the same name with words
 * added or dropped, or the start of the other. Names shorter than 4 letters are never
 * proposed. The first of the closest wins, so list the names that already exist first.
 * The candidates are prepared once, since a list can hold hundreds.
 */
export function similarFinder(candidates: ReadonlyArray<string>) {
  const prepared = candidates.map(prepare)
  return (name: string): string | null => {
    const own = prepare(name)
    if (own.folded.length < 4) return null
    const limit = own.folded.length >= 9 ? 2 : 1
    let best: string | null = null
    let bestDistance = limit + 1
    for (const other of prepared) {
      if (other.folded.length < 4 || other.plain === own.plain) continue
      let d = limit + 1
      if (other.folded === own.folded) d = 0
      else if (containsWords(own, other) || isPrefix(own, other)) d = 1
      else d = distance(own.folded, other.folded, limit)
      if (d < bestDistance) {
        best = other.name
        bestDistance = d
      }
    }
    return best
  }
}

export function similarName(
  name: string,
  candidates: ReadonlyArray<string>,
): string | null {
  return similarFinder(candidates)(name)
}
