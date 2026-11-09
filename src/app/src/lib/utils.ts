import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// `rounded-field` is our own radius: unregistered, it would not replace `rounded-xl`.
const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ['field'] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
