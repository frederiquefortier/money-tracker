import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useToast } from '#/hooks/app/use-toast'

/**
 * "Créer « … »" in a picker: saves the typed name, keeps the new item listed until the
 * loader brings it back, and hands it to `onCreated`. A failure shows a toast.
 */
export function useInlineCreate<T extends { id: string }>(
  loaded: ReadonlyArray<T>,
  {
    save,
    onCreated,
  }: {
    /** Saves `name` and returns the new item, or null when it was not saved. */
    save: (name: string, items: ReadonlyArray<T>) => Promise<T | null>
    onCreated: (item: T) => void
  },
) {
  const { t } = useTranslation()
  const toast = useToast()
  const router = useRouter()
  const [created, setCreated] = useState<Array<T>>([])
  const items = [
    ...loaded,
    ...created.filter((c) => !loaded.some((l) => l.id === c.id)),
  ]

  async function create(name: string) {
    const item = await save(name, items).catch(() => null)
    if (!item) {
      toast({ text: t('common.saveFailed'), tone: 'error' })
      return
    }
    setCreated((list) => [...list, item])
    onCreated(item)
    await router.invalidate()
  }

  return { items, create: (name: string) => void create(name) }
}
