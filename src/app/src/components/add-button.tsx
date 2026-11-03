import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Icon } from '#/components/icon'
import { Button } from '#/components/ui/button'

/** "+ Compte" beside a list's title; the plus stands for "Ajouter", spelled out in `label`. */
export function AddButton({
  text,
  label,
  ...link
}: { text: string; label: string } & LinkProps) {
  return (
    <Button asChild variant="outline">
      <Link {...link} aria-label={label}>
        <Icon name="plus" className="size-4" />
        {text}
      </Link>
    </Button>
  )
}
