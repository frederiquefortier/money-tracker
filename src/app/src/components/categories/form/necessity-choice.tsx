import { useTranslation } from 'react-i18next'
import { ChoiceField } from '#/components/forms/choice-field'
import { NECESSITIES } from '#/lib/categories/category-necessity'
import type { Necessity } from '#/lib/categories/category-necessity'

/**
 * CAT-10. The first choice stores nothing: a top-level category is then unclassified,
 * and a sub-category follows `source`, its nearest marked parent, named in the label.
 */
export function NecessityChoice({
  value,
  inherits,
  source,
  onChange,
}: {
  value: Necessity | null
  /** A sub-category: the first choice is what its parent says. */
  inherits: boolean
  source?: { necessity: Necessity }
  onChange: (next: Necessity | null) => void
}) {
  const { t } = useTranslation()
  let none = t('categories.unclassified')
  if (inherits) {
    none = t('categories.followedFrom', {
      value: source
        ? t(`categories.necessities.${source.necessity}`)
        : t('categories.unclassifiedLower'),
    })
  }
  return (
    <ChoiceField
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
