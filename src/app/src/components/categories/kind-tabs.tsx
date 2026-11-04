import { useTranslation } from 'react-i18next'
import { TabList } from '#/components/tab-list'
import { KINDS } from '#/lib/categories'
import type { Kind } from '#/lib/categories'

/** CAT-02: one tab per kind. The list below is the panel. */
export function KindTabs({
  kind,
  panelId,
  onChange,
}: {
  kind: Kind
  panelId: string
  onChange: (kind: Kind) => void
}) {
  const { t } = useTranslation()
  return (
    <TabList
      label={t('categories.kindsLabel')}
      tabs={KINDS}
      value={kind}
      labelOf={(k) => t(`categories.kinds.${k}`)}
      panelId={panelId}
      idPrefix="tab"
      onSelect={onChange}
    />
  )
}
