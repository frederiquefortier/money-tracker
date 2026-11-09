import { useTranslation } from 'react-i18next'
import { ChoiceMenu } from '#/components/display/choice-menu'

/** The sort beside a list's title: the icon and the current order, "Trier: …" for screen readers. */
export function SortMenu<TSort extends string>({
  sort,
  options,
  labelOf,
  onChange,
}: {
  sort: TSort
  options: ReadonlyArray<TSort>
  labelOf: (sort: TSort) => string
  onChange: (sort: TSort) => void
}) {
  const { t } = useTranslation()
  return (
    <ChoiceMenu
      icon="sort-ascending"
      label={t('common.sortLabel', { sort: labelOf(sort) })}
      value={sort}
      options={options}
      labelOf={labelOf}
      onChange={onChange}
    />
  )
}
