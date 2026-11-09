import { useTranslation } from 'react-i18next'
import { TabList } from '#/components/lists/tab-list'
import { KINDS } from '#/lib/categories/category'
import type { CategoryKind } from '#/lib/categories/category'

/**
 * CAT-02: one tab per kind, over the list on Catégories (plural labels) or the category
 * form (singular), where a sub-category's are disabled: it takes its parent's kind.
 */
export function KindTabs({
  kind,
  panelId,
  onChange,
  singular = false,
  disabled = false,
}: {
  kind: CategoryKind
  panelId: string
  onChange: (kind: CategoryKind) => void
  singular?: boolean
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <TabList
      label={t('categories.kindsLabel')}
      tabs={KINDS}
      value={kind}
      labelOf={(k) =>
        t(singular ? `categories.kind.${k}` : `categories.kinds.${k}`)
      }
      panelId={panelId}
      idPrefix={singular ? 'form-kind' : 'tab'}
      disabled={disabled}
      onSelect={onChange}
    />
  )
}
