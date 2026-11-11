// Names are compared as the database does: case, accents and extra spaces ignored.

/** Case, accents and extra spaces ignored, as the database compares names. */
export function foldName(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function categoryParts(path: string) {
  return path
    .split('>')
    .map((part) => part.trim())
    .filter((part) => part !== '')
}

export function foldPath(path: string) {
  return categoryParts(path).map(foldName).join(' > ')
}
