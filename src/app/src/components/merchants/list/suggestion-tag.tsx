import { useTranslation } from 'react-i18next'
import { Sparkle } from '#/components/display/sparkle'
import { focusRing } from '#/components/styles'
import { useServerAction } from '#/hooks/app/use-server-action'
import type { Merchant } from '#/lib/merchants/merchant'
import { cn } from '#/lib/utils'
import { saveMerchant } from '#/server/merchants'

/**
 * MER-08: the sparkle marks a category chosen by the app. Clicking the tag confirms it as
 * the merchant's default category.
 */
export function SuggestionTag({
  merchant,
  path,
}: {
  merchant: Merchant
  path: string
}) {
  const { t } = useTranslation()
  const { run, busy } = useServerAction()
  return (
    <button
      type="button"
      title={t('merchants.confirmSuggestion', { category: path })}
      aria-label={t('merchants.confirmSuggestion', { category: path })}
      disabled={busy}
      onClick={() =>
        run(() =>
          saveMerchant({
            data: {
              id: merchant.id,
              name: merchant.name,
              defaultCategoryId: merchant.suggestedCategoryId,
              aliases: merchant.aliases,
            },
          }),
        )
      }
      className={cn(
        'mr-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 text-xs font-semibold text-primary hover:bg-secondary/70 disabled:opacity-50',
        focusRing,
      )}
    >
      <Sparkle className="size-2.5" />
      {t('merchants.suggested')}
    </button>
  )
}
