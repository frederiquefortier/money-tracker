import { tablePanel } from '#/components/styles'

/** What a row opens, on its own row under it and within the card's width. */
export function TablePanel({
  id,
  colSpan,
  children,
}: {
  id: string
  colSpan: number
  children: React.ReactNode
}) {
  return (
    <tr id={id} className="border-b">
      <td colSpan={colSpan} className="p-0">
        <div className={tablePanel}>{children}</div>
      </td>
    </tr>
  )
}
