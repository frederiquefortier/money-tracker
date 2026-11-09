import { useStoredIds } from '#/hooks/app/use-stored-state'

/** Open branches, remembered per browser and shared by Catégories and the category list. */
export function useExpandedBranches(parents: ReadonlyArray<string>) {
  const open = useStoredIds('categories.expanded')
  const allExpanded =
    parents.length > 0 && parents.every((id) => open.ids.has(id))
  return {
    expanded: open.ids,
    allExpanded,
    toggle: open.toggle,
    toggleAll: () => open.setAll(parents, !allExpanded),
    expand: open.add,
  }
}
