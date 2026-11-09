import type { merchantsFr } from '../fr/merchants'

export const merchantsEn: typeof merchantsFr = {
  merchants: {
    title: 'Merchants',
    empty: 'No merchants yet.',
    add: 'Add a merchant',
    sort: {
      nameAsc: 'Name A–Z',
      nameDesc: 'Name Z–A',
      category: 'Category',
    },
    filterAll: 'All categories',
    filterNone: 'No category',
    newTitle: 'New merchant',
    editTitle: 'Edit merchant',
    name: 'Name',
    defaultCategory: 'Default category',
    created: 'Merchant created.',
    updated: 'Merchant saved.',
    merge: 'Merge',
    deleteKeeps_one:
      'The transaction keeps its category and loses the merchant.',
    deleteKeeps_other:
      'The {{count}} transactions keep their category and lose the merchant.',
    mergeName: 'Merge “{{name}}”',
    mergeInto: 'Merge into',
    mergeEffect:
      'The transactions of “{{source}}” will move to “{{target}}”, then “{{source}}” will be deleted.',
    mergeAlone: 'You need at least one other merchant.',
  },
}
