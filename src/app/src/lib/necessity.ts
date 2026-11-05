/** CAT-10: expense categories only. */
export const NECESSITIES = ['need', 'want'] as const
export type Necessity = (typeof NECESSITIES)[number]

type Node = { parentId: string | null; necessity: Necessity | null }

/** Where a category with no mark of its own gets one: its nearest marked parent (CAT-10). */
export function necessitySource<T extends Node>(
  parentId: string | null,
  byId: ReadonlyMap<string, T>,
): (T & { necessity: Necessity }) | undefined {
  let parent = parentId ? byId.get(parentId) : undefined
  while (parent) {
    if (parent.necessity) return { ...parent, necessity: parent.necessity }
    parent = parent.parentId ? byId.get(parent.parentId) : undefined
  }
  return undefined
}
