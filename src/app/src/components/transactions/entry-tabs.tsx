import { useTranslation } from 'react-i18next'
import { TabList } from '#/components/tab-list'

export const ENTRY_KINDS = ['expense', 'income', 'transfer'] as const
export type EntryKind = (typeof ENTRY_KINDS)[number]

/**
 * The kind first (spec 15): Dépense, Revenu, Transfert. A saved transaction keeps its
 * kind family, so editing shows only the tabs it can switch to.
 */
export function EntryTabs({
  kind,
  tabs = ENTRY_KINDS,
  panelId,
  onChange,
}: {
  kind: EntryKind
  tabs?: ReadonlyArray<EntryKind>
  panelId: string
  onChange: (kind: EntryKind) => void
}) {
  const { t } = useTranslation()
  return (
    <TabList
      label={t('transactions.kindsLabel')}
      tabs={tabs}
      value={kind}
      labelOf={(k) => t(`transactions.kinds.${k}`)}
      panelId={panelId}
      idPrefix="kind"
      onSelect={onChange}
    />
  )
}
