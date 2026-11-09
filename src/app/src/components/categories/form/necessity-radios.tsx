import { useTranslation } from 'react-i18next'
import { RadioGroupField } from '#/components/forms/radio-group-field'
import { NECESSITIES } from '#/lib/categories/category-necessity'
import type { Necessity } from '#/lib/categories/category-necessity'

/**
 * CAT-10 as radios. The first choice stores nothing: a top-level category is then
 * unclassified, and a sub-category follows `source`, its nearest marked parent.
 */
export function NecessityRadios({
  value,
  parentName,
  source,
  onChange,
}: {
  value: Necessity | null
  /** Set on a sub-category. */
  parentName?: string
  source?: { necessity: Necessity }
  onChange: (next: Necessity | null) => void
}) {
  const { t } = useTranslation()
  let none = t('categories.unclassified')
  if (parentName) {
    none = t('categories.followedFrom', {
      parent: parentName,
      value: source
        ? t(`categories.necessities.${source.necessity}`)
        : t('categories.unclassifiedLower'),
    })
  }
  return (
    <RadioGroupField
      label={t('categories.necessity')}
      value={value ?? 'none'}
      onChange={(next) => onChange(next === 'none' ? null : next)}
      options={[
        { value: 'none', label: none },
        ...NECESSITIES.map((n) => ({
          value: n,
          label: t(`categories.necessities.${n}`),
        })),
      ]}
    />
  )
}
