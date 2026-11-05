import { Link } from '@tanstack/react-router'
import { rowHover } from '#/components/list-card'
import { GroupAvatars, PersonAvatar } from '#/components/people/avatars'
import { PeopleActions } from '#/components/people/people-actions'
import type { PeopleKind } from '#/components/people/people-actions'
import { cn, focusRing } from '#/lib/utils'

/**
 * A person (their avatar, then their groups under the name) or a group (its members'
 * avatars, then their names). `aside` is the archive date in the archived section.
 */
export function PeopleRow({
  kind,
  row,
  details,
  memberNames,
  aside,
}: {
  kind: PeopleKind
  row: { id: string; name: string; archivedOn: string | null }
  details: string
  memberNames: ReadonlyArray<string>
  aside?: React.ReactNode
}) {
  const link =
    kind === 'person'
      ? ({
          to: '/settings/people/$personId',
          params: { personId: row.id },
        } as const)
      : ({
          to: '/settings/people/groups/$groupId',
          params: { groupId: row.id },
        } as const)

  return (
    <li className={cn('flex items-center pr-2', rowHover)}>
      <Link
        {...link}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 py-3 pl-4',
          focusRing,
        )}
      >
        {kind === 'person' ? (
          <PersonAvatar name={row.name} />
        ) : (
          <GroupAvatars names={memberNames} />
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{row.name}</span>
          {details && (
            <span className="truncate text-sm text-muted-foreground">
              {details}
            </span>
          )}
        </span>
        {aside}
      </Link>
      <PeopleActions kind={kind} row={row} />
    </li>
  )
}
