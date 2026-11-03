# Icons

Every icon in the app comes from [coolicons](https://icon-sets.iconify.design/coolicons/)
(ADR-020), MIT licence, Copyright (c) 2026 Kryston Schwarze
(https://github.com/krystonschwarze/coolicons).

`coolicons.json` holds only the icons the app uses, in Iconify's JSON format, rendered by
`src/components/icon.tsx` through `@iconify/react/offline` (no network at runtime).

To add an icon, find its name on the site, add it to the list, and regenerate the file:

```
curl -sSf "https://api.iconify.design/coolicons.json?icons=pig-fill,circle-warning,circle-check,shield-check,log-out,log-in,key,lock,mail,arrow-left,arrow-right,eye,eye-off,receipt,receipt-fill,chart-pie,chart-pie-fill,target,target-fill,settings,settings-fill,coins,star,star-fill,chevron-down,plus,check,search,close,loading,trash,house-check" -o src/icons/coolicons.json
```

The `IconName` type follows the file, so a name that is not in it fails type-checking.
