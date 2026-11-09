/** For search: case and accents ignored, so "americain" finds "Dollar américain". */
export function foldForSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/** Whether a text contains the query, folded the same way; an empty query matches all. */
export function matcher(query: string) {
  const q = foldForSearch(query)
  return (text: string) => foldForSearch(text).includes(q)
}
