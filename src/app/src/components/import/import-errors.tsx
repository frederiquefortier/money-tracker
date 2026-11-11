/import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
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

/** Step 2 when something is wrong (spec 18): by file, the first hundred, all copyable. */
export function ImportErrors({
  errors,
  count,
}: {
  errors: ReadonlyArray<ImportErrorItem>
  count: number
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const files = [...new Set(errors.slice(0, SHOWN).map((e) => e.file))]
  return (
    <section
      className={cn(
        cardSurface,
        'flex flex-col gap-3 border-destructive/40 bg-destructive/10 p-4',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-destructive">
          {t('import.errorsTitle', { count })}
        </h2>
        <IconButton
          icon="copy"
          label={t('import.copyErrors')}
          onClick={() => {
            void navigator.clipboard
              .writeText(plainText(t, errors))
              .then(() => toast({ text: t('import.errorsCopied') }))
          }}
        />
      </div>
      {files.map((file) => (
        <div key={file} className="flex flex-col gap-1">
          <h3 className="font-mono text-sm font-bold">{file}</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {errors
              .slice(0, SHOWN)
              .filter((e) => e.file === file)
              .map((e, i) => (
                <li key={`${e.line}-${e.code}-${i}`} className="flex gap-2">
                  <span className="w-20 shrink-0 text-muted-foreground">
                    {t('import.errorLine', { line: e.line })}
                  </span>
                  <span>{errorText(t, e)}</span>
                </li>
              ))}
          </ul>
        </div>
      ))}
      {count > SHOWN && (
        <p className="text-sm text-muted-foreground">
          {t('import.firstErrors', { count: SHOWN })}
        </p>
      )}
    </section>
  )
}
