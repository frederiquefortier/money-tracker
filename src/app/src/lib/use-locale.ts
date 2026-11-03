import { useRouteContext } from '@tanstack/react-router'

export function useLocale() {
  return useRouteContext({ from: '__root__' }).session.locale
}
