import { createContext, useContext } from 'react'

export type ToastOptions = { text: string }

export const ToastContext = createContext<(toast: ToastOptions) => void>(
  () => {},
)

export function useToast() {
  return useContext(ToastContext)
}
