import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { IMPORT_STEPS, stepState } from '#/lib/import/import-stage'
import type { ImportStage, StepState } from '#/lib/import/import-stage'
import { cn } from '#/lib/utils'

const STEP_ICON: Record<(typeof IMPORT_STEPS)[number], IconName> = {
  files: 'import',
  import: 'arrow-left-right',
}

/** A finished step is solid, the current one ringed with its icon, the next pale. */
function Marker({ state, icon }: { state: StepState; icon: IconName }) {
  if (state === 'active') {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-primary">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
          <Icon name={icon} className="size-4" />
        </span>
      </span>
    )
  }
  return (
    <span
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full',
        state === 'done'
          ? 'bg-primary text-primary-foreground'
          : 'border-2 border-input text-muted-foreground',
      )}
    >
      <Icon name={state === 'done' ? 'check' : icon} />
    </span>
  )
}

/** Where the import stands: the files, then the summary and the import. */
export function ImportSteps({ stage }: { stage: ImportStage }) {
  const { t } = useTranslation()
  return (
    <ol
      className="mx-auto flex w-full max-w-md items-start py-2"
      aria-label={t('import.title')}
    >
      {IMPORT_STEPS.map((step, i) => {
        const state = stepState(i, stage)
        const last = i === IMPORT_STEPS.length - 1
        return (
          <Fragment key={step}>
            <li
              aria-current={state === 'active' ? 'step' : undefined}
              className="flex w-24 shrink-0 flex-col items-center gap-1.5 text-center"
            >
              <Marker state={state} icon={STEP_ICON[step]} />
              <span className="text-xs text-muted-foreground uppercase">
                {t('import.stepLabel', { number: i + 1 })}
              </span>
              <span
                className={cn(
                  'font-semibold',
                  state === 'todo' && 'text-muted-foreground',
                )}
              >
                {t(`import.steps.${step}`)}
              </span>
            </li>
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'mt-5 h-0.5 flex-1 rounded-full transition-colors',
                  state === 'done' ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </Fragment>
        )
      })}
    </ol>
  )
}
