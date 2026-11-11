import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { useServerAction } from '#/hooks/app/use-server-action'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { mergePeople } from '#/server/people'

type Named = { id: string; name: string }

/** PPL-07: the chosen person keeps their name; the other one becomes an alias. */
export function PeopleMergeDialog({
  person,
  people,
  onClose,
}: {
  person: Named
  people: ReadonlyArray<Named>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { run, busy } = useServerAction()
  const [target, setTarget] = useState<string | null>(null)
  const targetName = people.find((p) => p.id === target)?.name
  const options = people
    .filter((p) => p.id !== person.id)
    .map((p) => ({ value: p.id, label: p.name }))
    .sort((a, b) => a.label.localeCompare(b.label, locale))

  return (
    <ConfirmDialog
      open
      title={t('people.mergeName', { name: person.name })}
      confirmLabel={t('people.merge')}
      irreversible={false}
      busy={busy}
      canConfirm={target !== null}
      onCancel={onClose}
      onConfirm={() => {
        if (target)
          run(() => mergePeople({ data: { source: person.id, target } }), {
            onResult: onClose,
            failureText: (error) =>
              error === 'sharedTransaction'
                ? t('people.mergeShared')
                : undefined,
          })
      }}
    >
      <Combobox
        label={t('people.mergeInto')}
        required
        options={options}
        value={target}
        onChange={setTarget}
        clearLabel={t('common.clear')}
      />
      {targetName && (
        <p className="text-sm">
          {t('people.mergeEffect', { source: person.name, target: targetName })}
        </p>
      )}
    </ConfirmDialog>
  )
}
