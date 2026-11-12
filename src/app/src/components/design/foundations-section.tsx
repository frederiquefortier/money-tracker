import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import uiIcons from '#/icons/ui-icons.json'

// Literal class names, so Tailwind sees them.
const COLORS = [
  ['background', 'bg-background'],
  ['card', 'bg-card'],
  ['primary', 'bg-primary'],
  ['secondary', 'bg-secondary'],
  ['muted', 'bg-muted'],
  ['accent', 'bg-accent'],
  ['destructive', 'bg-destructive'],
  ['income', 'bg-income'],
  ['warning', 'bg-warning'],
  ['pending', 'bg-pending'],
  ['owed', 'bg-owed'],
  ['border', 'bg-border'],
  ['input', 'bg-input'],
  ['ring', 'bg-ring'],
] as const

const ICONS = Object.keys(uiIcons.icons) as Array<IconName>

export function FoundationsSection() {
  return (
    <GallerySection id="foundations" title="Foundations">
      <Specimen name="Colours" source="styles.css">
        {COLORS.map(([name, swatch]) => (
          <div key={name} className="flex w-24 flex-col gap-1">
            <div className={`h-12 rounded-lg border ${swatch}`} />
            <span className="text-xs">{name}</span>
          </div>
        ))}
      </Specimen>
      <Specimen name="Text" source="Nunito, Inconsolata for titles and buttons">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xl font-bold tracking-wide uppercase">
            Page title
          </p>
          <p className="font-mono text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Group heading
          </p>
          <p>Body text</p>
          <p className="text-sm font-semibold">Small, semibold</p>
          <p className="text-sm text-muted-foreground">Muted</p>
          <p className="text-income">Income</p>
          <p className="text-destructive">Error</p>
          <p className="text-warning-foreground">Warning</p>
        </div>
      </Specimen>
      <Specimen name="Radius" source="styles.css">
        {[
          ['field', 'rounded-field'],
          ['lg', 'rounded-lg'],
          ['xl', 'rounded-xl'],
          ['full', 'rounded-full'],
        ].map(([name, radius]) => (
          <div key={name} className="flex flex-col items-center gap-1">
            <div className={`size-14 border-2 border-primary ${radius}`} />
            <span className="text-xs">{name}</span>
          </div>
        ))}
      </Specimen>
      <Specimen name={`Icons (${ICONS.length})`} source="display/icon.tsx">
        <ul className="grid w-full grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
          {ICONS.map((name) => (
            <li
              key={name}
              className="flex flex-col items-center gap-1 rounded-lg border p-2 text-center"
            >
              <Icon name={name} className="size-6" />
              <span className="w-full truncate text-xs text-muted-foreground">
                {name}
              </span>
            </li>
          ))}
        </ul>
      </Specimen>
    </GallerySection>
  )
}
