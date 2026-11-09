// The Magasins screens (spec 13).
export const merchantsFr = {
  merchants: {
    title: 'Magasins',
    empty: 'Aucun magasin pour l’instant.',
    add: 'Ajouter un magasin',
    sort: {
      nameAsc: 'Nom A–Z',
      nameDesc: 'Nom Z–A',
      category: 'Catégorie',
    },
    filterAll: 'Toutes les catégories',
    filterNone: 'Sans catégorie',
    newTitle: 'Nouveau magasin',
    editTitle: 'Modifier le magasin',
    name: 'Nom',
    defaultCategory: 'Catégorie par défaut',
    created: 'Magasin créé.',
    updated: 'Magasin enregistré.',
    merge: 'Fusionner',
    deleteKeeps_one: 'La transaction garde sa catégorie et perd le magasin.',
    deleteKeeps_other:
      'Les {{count}} transactions gardent leur catégorie et perdent le magasin.',
    mergeName: 'Fusionner “{{name}}”',
    mergeInto: 'Fusionner avec',
    mergeEffect:
      'Les transactions de “{{source}}” passeront à “{{target}}”, puis “{{source}}” sera supprimé.',
    mergeAlone: 'Il faut au moins un autre magasin.',
  },
}
