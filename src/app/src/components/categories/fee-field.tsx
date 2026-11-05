import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { iconHover } from '#/components/icon-button'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { cn, focusRing } from '#/lib/utils'

/**
 * TRX-04, CUR-08: the one expense category every fee goes to. Ticking it here takes the
 * role from the category that had it; the one that has it cannot untick it, another has
 * to take it. The info button says which fees, on tap as well as hover.
 */
export function FeeField({
  checked,
  locked,
  onChange,
}: {
  checked: boolean
  /** Already the fee category when the form opened. */
  locked: boolean
  onChange: (checked: boolean) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        id={id}
        checked={checked}
        disabled={locked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id} className="cursor-pointer text-sm font-medium">
        {t('categories.feeCategory')}
      </label>
      <Popover>
        <PopoverTrigger
          aria-label={t('categories.feeCategoryAbout')}
          className={cn('rounded-full', iconHover.self, focusRing)}
        >
          <Icon name="circle-info" className="size-5" />
        </PopoverTrigger>
        <PopoverContent className="max-w-72">
          {t('categories.feeCategoryHelp')}
        </PopoverContent>
      </Popover>
    </div>
  )
}
