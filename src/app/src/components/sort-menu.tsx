import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

/** "Trier: …" beside a list's title: an outline button with a chevron, like a select. */
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Icon name="sort-ascending" className="size-4" />
          {t('common.sortLabel', { sort: labelOf(sort) })}
          <Icon name="chevron-down" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={sort}
          onValueChange={(value) => {
            const next = options.find((option) => option === value)
            if (next) onChange(next)
          }}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {labelOf(option)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
