# Icons

Every icon in the app comes from [coolicons](https://icon-sets.iconify.design/coolicons/)
(ADR-020), MIT licence, Copyright (c) 2026 Kryston Schwarze
(https://github.com/krystonschwarze/coolicons).

`ui-icons.json` holds only the icons the app uses, in Iconify's JSON format, rendered by
`src/components/icon.tsx` through `@iconify/react/offline` (no network at runtime).

To add an icon, find its name on the site, add it to the list, and regenerate the file:

```
curl -sSf "https://api.iconify.design/coolicons.json?icons=archive,arrow-left,arrow-left-right,arrow-right,bank,calendar,chart-bar-stacked,chart-line,chart-line-fill,chart-pie,chart-pie-fill,check,chevron-down,chevron-left,chevron-right,circle-check,circle-info,circle-slash,circle-warning,clock,close,coins,copy,external-link,eye,eye-off,filter,house-check,import,key,loading,lock,log-in,log-out,mail,menu,merge,minus,more-vertical,pencil,pig-fill,plus,receipt,receipt-fill,scale,search,shield-check,sort-ascending,split,store,tags,target,target-fill,trash-full,undo,unfold-less,unfold-more,user,users,wallet,wallet-fill,settings,circle-help" -o src/icons/ui-icons.json
```

The `IconName` type follows the file, so a name that is not in it fails type-checking.

## Category icons

`categories/keywords.json` is the curated list the category picker offers (CAT-07):
each icon with search words in French and English, lowercase. While a category name is
typed, the first entry with a matching word becomes the suggestion, so specific entries
come before general ones ("Essence" finds `fuel` before "Transport" finds `car`). Their
drawings are in `categories/glyphs.json`, loaded only by the category components.
After editing the list, regenerate it:

```
curl -sSf "https://api.iconify.design/coolicons.json?icons=$(node -p "require('./src/icons/categories/keywords.json').map((i) => i.name).join(',')")" -o src/icons/categories/glyphs.json
```

`categories/custom.json` holds the icons coolicons does not have, drawn in its style (24px,
2px round strokes), so regenerating `glyphs.json` never drops them: `ring` (a wedding, an
engagement). Their names are in `keywords.json` like the others; the curl above reports
them as not found and the rest is unaffected.
