import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '#/components/display/icon-button'
import { CreateRow } from '#/components/forms/create-row'
import { FieldLabel } from '#/components/ui/field'
import { useToast } from '#/hooks/app/use-toast'
import { useMarkChanged } from '#/hooks/forms/use-sheet'
import { foldForSearch } from '#/lib/shared/search'
import { fieldCard } from '#/components/styles'

/**
 * PPL-06, MER-02: another spelling of a person's or merchant's name, for the import, in a
 * card like the groups' list: one per row with a × to remove it, and a last row adding
 * one. A spelling already used by another one, or twice here, is refused with a toast.
 */
export function AliasList({
  label,
  newLabel,
  aliases,
  taken,
  onChange,
}: {
  label: string
  newLabel: string
  aliases: ReadonlyArray<string>
  taken: ReadonlySet<string>
  onChange: (aliases: Array<string>) => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const markChanged = useMarkChanged()
  const labelId = useId()

  function add(alias: string) {
    const folded = foldForSearch(alias)
    if (taken.has(folded) || aliases.some((a) => foldForSearch(a) === folded)) {
      toast({ text: t('validation.nameTaken'), tone: 'error' })
      return
    }
    markChanged()
    onChange([...aliases, alias])
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <FieldLabel id={labelId}>{label}</FieldLabel>
      <div className={fieldCard}>
        {aliases.length > 0 && (
          <ul className="divide-y">
            {aliases.map((alias) => (
              <li
                key={alias}
                className="flex min-h-12 items-center gap-3 pr-2 pl-3"
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {alias}
                </span>
                <IconButton
                  icon="close"
                  label={t('common.removeName', { name: alias })}
                  onClick={() => {
                    markChanged()
                    onChange(aliases.filter((a) => a !== alias))
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        <CreateRow label={newLabel} onCreate={add} />
      </div>
    </div>
  )
}
