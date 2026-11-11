import { useMemo } from 'react'
import { isDropped } from '#/lib/import/import-edits'
import { similarFinder } from '#/lib/import/import-similar'
import type { Section, SectionItem } from '#/lib/import/import-sections'
import type { ImportTargets } from '#/lib/import/import'

/**
 * The name each new item looks like (IMP-06), found once per check: a list of hundreds is
 * compared with itself, which must not happen again each time a sheet opens.
 */
export function useImportSuggestions(
  sections: ReadonlyArray<Section>,
  targets: ImportTargets,
) {
  const found = useMemo(() => {
    const names = new Map<string, string>()
    for (const section of sections) {
      if (!section.mergeKind) continue
      const live = section.items.filter(
        (item) => item.mergedInto === null && !isDropped(item.edit),
      )
      const find = similarFinder([
        ...targets[section.mergeKind],
        ...live.map((item) => item.label),
      ])
      for (const item of live) {
        const name = find(item.label)
        if (name) names.set(`${section.key}:${item.key}`, name)
      }
    }
    return names
  }, [sections, targets])
  return (section: Section, item: SectionItem) =>
    found.get(`${section.key}:${item.key}`) ?? null
}
