import { CategoryBadge } from '#/components/categories/category-badge'
import { ListRow } from '#/components/lists/list-row'
import { MerchantActions } from '#/components/merchants/merchant-actions'
import { SuggestionTag } from '#/components/merchants/suggestion-tag'
import type { Merchant } from '#/lib/merchants/merchant'
import { cn } from '#/lib/utils'

/**
 * The default category's icon (MER-01) as tall as the two lines beside it: the name, then
 * the category. With no category, an empty circle keeps the names aligned.
 */
export function MerchantRow({
  merchant,
  merchants,
  category,
  suggestion,
}: {
  merchant: Merchant
  merchants: ReadonlyArray<Merchant>
  category: { path: string; icon: string; color: string } | undefined
  /** MER-08: shown in place of a default category the merchant does not have. */
  suggestion: { path: string; icon: string; color: string } | undefined
}) {
  const shown = category ?? suggestion
  return (
    <ListRow
      link={{
        to: '/settings/merchants/$merchantId',
        params: { merchantId: merchant.id },
      }}
      actions={<MerchantActions merchant={merchant} merchants={merchants} />}
      trailing={
        !category && suggestion ? (
          <SuggestionTag merchant={merchant} path={suggestion.path} />
        ) : undefined
      }
    >
      {shown ? (
        <CategoryBadge
          icon={shown.icon}
          color={shown.color}
          className={cn('size-11 [&_svg]:size-6', !category && 'opacity-50')}
        />
      ) : (
        <span
          aria-hidden="true"
          className="size-11 shrink-0 rounded-full border border-dashed"
        />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-semibold">{merchant.name}</span>
        {shown && (
          <span
            className={cn(
              'truncate text-sm text-muted-foreground',
              !category && 'italic',
            )}
          >
            {shown.path}
          </span>
        )}
      </span>
    </ListRow>
  )
}
