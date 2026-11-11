import type { ImportCheck } from '#/lib/import/import'

/** The steps of the screen; `done` is after the last. */
export const IMPORT_STEPS = ['files', 'import'] as const
export type ImportStage = (typeof IMPORT_STEPS)[number] | 'done'

/**
 * Where the import stands: the files (their upload ends with the check), the summary of a
 * good check, or finished. A refused check keeps the files step, with its errors.
 */
export function stageOf({
  done,
  check,
}: {
  done: boolean
  check: ImportCheck | null
}): ImportStage {
  if (done) return 'done'
  return check?.ok ? 'import' : 'files'
}

export type StepState = 'done' | 'active' | 'todo'

export function stepState(index: number, stage: ImportStage): StepState {
  const current =
    stage === 'done' ? IMPORT_STEPS.length : IMPORT_STEPS.indexOf(stage)
  if (index < current) return 'done'
  return index === current ? 'active' : 'todo'
}
