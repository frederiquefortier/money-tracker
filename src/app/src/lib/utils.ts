import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// The shadcn focus ring, for controls that are not shadcn components.
export const focusRing =
  'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
