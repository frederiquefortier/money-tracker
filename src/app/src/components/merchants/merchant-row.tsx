import { Link } from '@tanstack/react-router'
import { CategoryBadge } from '#/components/categories/category-badge'
import { rowHover } from '#/components/list-card'
import { MerchantActions } from '#/components/merchants/merchant-actions'
import type { Merchant } from '#/lib/merchants'
import { cn, focusRing } from '#/lib/utils'

/** The name, then its default category (MER-01) when it has one. */
export function MerchantRow({
  merchant,
  merchants,
  category,
}: {
  merchant: Merchant
  merchants: ReadonlyArray<Merchant>
  category: { path: string; icon: string; color: string } | undefined
}) {
  return (
    <li className={cn('flex items-center pr-2', rowHover)}>
      <Link
        to="/settings/merchants/$merchantId"
        params={{ merchantId: merchant.id }}
        className={cn('flex min-w-0 flex-1 flex-col py-3 pl-4', focusRing)}
      >
        <span className="truncate font-semibold">{merchant.name}</span>
        {category && (
          <span className="flex min-w-0 items-center gap-1.5 pt-1 text-sm text-muted-foreground">
            <CategoryBadge
              icon={category.icon}
              color={category.color}
              size="sm"
            />
            <span className="truncate">{category.path}</span>
          </span>
        )}
      </Link>
      <MerchantActions merchant={merchant} merchants={merchants} />
    </li>
  )
}
