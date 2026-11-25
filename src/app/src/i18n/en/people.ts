import type { peopleFr } from '../fr/people'

export const peopleEn: typeof peopleFr = {
  people: {
    title: 'People',
    tabsLabel: 'People or groups',
    sort: { nameAsc: 'Name (A to Z)', nameDesc: 'Name (Z to A)' },
    tabs: {
      people: 'People',
      groups: 'Groups',
    },
    empty: 'No people yet.',
    emptyGroups: 'No groups yet.',
    addPerson: 'Add a person',
    addGroup: 'Add a group',
    newPerson: 'New person',
    editPerson: 'Edit person',
    newGroup: 'New group',
    editGroup: 'Edit group',
    name: 'Name',
    groups: 'Groups',
    members: 'Members',
    aliases: 'Aliases',
    newAlias: 'New alias',
    personCreated: 'Person created.',
    personUpdated: 'Person saved.',
    groupCreated: 'Group created.',
    groupUpdated: 'Group saved.',
    archived_one: 'Archived ({{count}})',
    archived_other: 'Archived ({{count}})',
    archivedOn: 'Archived on {{date}}',
    archivedOnField: 'Archive date',
    deleteKeeps_one:
      'The transaction keeps its amount; their line becomes “Unnamed”.',
    deleteKeeps_other:
      'The {{count}} transactions keep their amounts; their lines become “Unnamed”.',
    owes: 'Owes me {{amount}}',
    plusUnknown: '+ unknown',
    owesUnknown: 'Owes me, amount unknown',
    merge: 'Merge',
    mergeName: 'Merge “{{name}}”',
    mergeInto: 'Merge into',
    mergeEffect:
      'The transactions, groups and events of “{{source}}” will move to “{{target}}”. “{{source}}” will be deleted and kept as another spelling of “{{target}}”.',
    mergeAlone: 'You need at least one other person.',
    mergeShared:
      'They are both on the same transaction. Remove one of them there first.',
    owedTitle: 'Owes me',
  },
}
