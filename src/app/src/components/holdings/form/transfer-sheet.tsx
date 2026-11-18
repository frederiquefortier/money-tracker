import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TransferFormSheet } from '#/components/holdings/form/transfer-form-sheet'
import type { ListedHolding } from '#/components/holdings/form/transfer-form-sheet'
import { TransferList } from '#/components/holdings/form/transfer-list'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { SheetBody } from '#/components/ui/sheet'
import type { HoldingTransfer, HoldingType } from '#/lib/holdings/holding'
import type { Institution } from '#/lib/institutions/institution'

/**
 * NW-03: a holding's transfers in a sheet of its own, like its values and contributions.
 * A new one opens in a sheet over this one; a transfer has no edit, only delete.
 */
export function TransferSheet({
  source,
  transfers,
  holdings,
  institutions,
  types,
}: {
  source: ListedHolding
  transfers: ReadonlyArray<HoldingTransfer>
  holdings: ReadonlyArray<ListedHolding>
  institutions: ReadonlyArray<Institution>
  types: ReadonlyArray<HoldingType>
}) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <RouteSheet to="/net-worth" title={t('holdings.transfers')}>
        <SheetBody>
          <TransferList
            transfers={transfers}
            labels={new Map(holdings.map((h) => [h.id, h.label]))}
            currency={source.currency}
            onAdd={() => setAdding(true)}
          />
        </SheetBody>
      </RouteSheet>
      {adding && (
        <TransferFormSheet
          source={source}
          holdings={holdings}
          institutions={institutions}
          types={types}
          onClosed={() => setAdding(false)}
        />
      )}
    </>
  )
}
