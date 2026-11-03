# Icons

Every icon in the app comes from [coolicons](https://icon-sets.iconify.design/coolicons/)
(ADR-020), MIT licence, Copyright (c) 2026 Kryston Schwarze
(https://github.com/krystonschwarze/coolicons).

`coolicons.json` holds only the icons the app uses, in Iconify's JSON format, rendered by
`src/components/icon.tsx` through `@iconify/react/offline` (no network at runtime).

To add an icon, find its name on the site, add it to the list, and regenerate the file:

```
curl -sSf "https://api.iconify.design/coolicons.json?icons=pig-fill,circle-warning,circle-check,shield-check,log-out,log-in,key,lock,mail,arrow-left,arrow-right,eye,eye-off,receipt,receipt-fill,chart-pie,chart-pie-fill,target,target-fill,settings,settings-fill,coins,star,star-fill,chevron-down,plus,check,close,loading,trash-full,house-check,bank,external-link,pencil,sort-ascending,archive,undo,tags,search,unfold-more,unfold-less" -o src/icons/coolicons.json
```

The `IconName` type follows the file, so a name that is not in it fails type-checking.

## Category icons

`category-icons.json` is the curated list the category picker offers (CAT-07, spec 12):
each icon with search words in French and English, lowercase. While a category name is
typed, the first entry with a matching word becomes the suggestion, so specific entries
come before general ones ("Essence" finds `fuel` before "Transport" finds `car`). Their
drawings are in `category-coolicons.json`, loaded only by the category components.
After editing the list, regenerate it:

```
curl -sSf "https://api.iconify.design/coolicons.json?icons=$(node -p "require('./src/icons/category-icons.json').map((i) => i.name).join(',')")" -o src/icons/category-coolicons.json
```
