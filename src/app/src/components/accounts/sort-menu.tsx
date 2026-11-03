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
import { SORTS } from '#/lib/accounts'
import type { Sort } from '#/lib/accounts'

/** ACC-07: sorts the rows inside each group; groups stay alphabetical. */
export function SortMenu({
  sort,
  onChange,
}: {
  sort: Sort
  onChange: (sort: Sort) => void
}) {
  const { t } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Icon name="sort-ascending" className="size-4" />
          {t('accounts.sortLabel', { sort: t(`accounts.sort.${sort}`) })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={sort}
          onValueChange={(value) => onChange(value as Sort)}
        >
          {SORTS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {t(`accounts.sort.${option}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
