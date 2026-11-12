import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ResetChoices } from '#/components/import/reset-choices'
import { IconBubble } from '#/components/display/icon-bubble'
import { IconButton } from '#/components/display/icon-button'
import { useToast } from '#/hooks/app/use-toast'
import { cardSurface } from '#/components/styles'
import { knownErrorCode } from '#/lib/import/import'
import type { ImportErrorItem } from '#/lib/import/import'
import { cn } from '#/lib/utils'

const SHOWN = 100

/** One fault in plain words, in the language of the screen. */
export function errorText(t: TFunction, error: ImportErrorItem) {
  const code = knownErrorCode(error.code)
  return code
    ? t(`import.errors.${code}`, { detail: error.detail })
    : t('import.errors.unknown', { code: error.code })
}

function plainText(t: TFunction, errors: ReadonlyArray<ImportErrorItem>) {
  return errors
    .map(
      (e) =>
        `${e.file}, ${t('import.errorLine', { line: e.line })}: ${errorText(t, e)}`,
    )
    .join('\n')
}

/**
 * When the rows are refused: a card that pairs with the done one. A red mark, what
 * happened and how many faults, each fault as a row (file and line, then the message), and
 * the actions at the right. `choices` is there when merges or edits are applied to the files,
 * since they can be what is refused.
 */
export function ImportErrors({
  errors,
  count,
  choices,
}: {
  errors: ReadonlyArray<ImportErrorItem>
  count: number
  choices?: { count: number; onReset: () => void }
}) {
  const { t } = useTranslation()
  const toast = useToast()
  return (
    <section
      className={cn(
        cardSurface,
        'flex flex-col items-center gap-5 px-5 pt-8 pb-5',
      )}
    >
      <IconBubble icon="circle-warning" tone="error" size="lg" />
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-lg font-semibold">{t('import.errorsHeading')}</h2>
        <p className="text-muted-foreground">
          {t('import.errorsTitle', { count })}
        </p>
      </div>
      <ul className="w-full divide-y border-y">
        {errors.slice(0, SHOWN).map((e, i) => (
          <li
            key={`${e.file}-${e.line}-${e.code}-${i}`}
            className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-start sm:gap-4"
          >
            <span className="flex shrink-0 flex-col sm:w-44">
              <span className="font-mono text-sm font-semibold">{e.file}</span>
              <span className="text-xs text-muted-foreground">
                {t('import.errorLine', { line: e.line })}
              </span>
            </span>
            <span className="text-sm">{errorText(t, e)}</span>
          </li>
        ))}
      </ul>
      {count > SHOWN && (
        <p className="text-sm text-muted-foreground">
          {t('import.firstErrors', { count: SHOWN })}
        </p>
      )}
      <div className="flex w-full flex-wrap items-center justify-end gap-2">
        <IconButton
          icon="copy"
          label={t('import.copyErrors')}
          onClick={() => {
            void navigator.clipboard
              .writeText(plainText(t, errors))
              .then(() =>
                toast({ text: t('import.errorsCopied'), tone: 'success' }),
              )
          }}
        />
        {choices && choices.count > 0 && (
          <ResetChoices count={choices.count} onReset={choices.onReset} />
        )}
      </div>
    </section>
  )
}
