import { Link } from '@tanstack/react-router'
import { CategoryBadge } from '#/components/categories/category-badge'
import { rowHover } from '#/components/list-card'
import { MerchantActions } from '#/components/merchants/merchant-actions'
import type { Merchant } from '#/lib/merchants'
import { cn, focusRing } from '#/lib/utils'

/**
 * The default category's icon (MER-01) as tall as the two lines beside it: the name, then
 * the category. With no category, an empty circle keeps the names aligned.
 */
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
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 py-3 pl-4',
          focusRing,
        )}
      >
        {category ? (
          <CategoryBadge
            icon={category.icon}
            color={category.color}
            className="size-11 [&_svg]:size-6"
          />
        ) : (
          <span
            aria-hidden="true"
            className="size-11 shrink-0 rounded-full border border-dashed"
          />
        )}
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{merchant.name}</span>
          {category && (
            <span className="truncate text-sm text-muted-foreground">
              {category.path}
            </span>
          )}
        </span>
      </Link>
      <MerchantActions merchant={merchant} merchants={merchants} />
    </li>
  )
}
