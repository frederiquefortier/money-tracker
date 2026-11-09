/** For search: case and accents ignored, so "americain" finds "Dollar américain". */
export function foldForSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}
