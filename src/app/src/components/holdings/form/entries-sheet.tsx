import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EntryList } from '#/components/holdings/form/entry-lists'
import type { EntryKind } from '#/components/holdings/form/entry-lists'
import { EntrySheet } from '#/components/holdings/form/entry-sheet'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { SheetBody } from '#/components/ui/sheet'
import { todayIso } from '#/lib/shared/format'
import { deleteContribution, deleteSnapshot } from '#/server/holding-entries'
import type { HoldingDetail } from '#/lib/holdings/holding'

/**
 * A holding's values or external contributions, in a sheet of their own over the holdings.
 * A row opens in a sheet over this one (NW-02, NW-03).
 */
export function EntriesSheet({
  kind,
  holding,
}: {
  kind: EntryKind
  holding: HoldingDetail
}) {
  const { t } = useTranslation()
  // The row being edited, or null for a new one; undefined while none is open.
  const [open, setOpen] = useState<{ id: string | null } | undefined>()
  const values = kind === 'snapshot'
  const rows = values ? holding.snapshots : holding.contributions
  const label = t(values ? 'holdings.values' : 'holdings.contributions')

  return (
    <>
      <RouteSheet to="/net-worth/holdings" title={label}>
        <SheetBody>
          <EntryList
            label={label}
            addLabel={t(
              values ? 'holdings.addValue' : 'holdings.addContribution',
            )}
            rows={rows}
            currency={holding.currency}
            onOpen={(id) => setOpen({ id })}
            onDelete={(id) =>
              values
                ? deleteSnapshot({ data: { id } })
                : deleteContribution({ data: { id } })
            }
          />
        </SheetBody>
      </RouteSheet>
      {open && (
        <EntrySheet
          kind={kind}
          entry={rows.find((row) => row.id === open.id) ?? null}
          holdingId={holding.id}
          currency={holding.currency}
          today={todayIso()}
          onClosed={() => setOpen(undefined)}
        />
      )}
    </>
  )
}
