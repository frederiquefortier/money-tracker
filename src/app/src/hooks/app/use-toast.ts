import { createContext, useContext } from 'react'

/** `neutral` is a plain note; `success` and `error` use the FormAlert tones. */
export type ToastOptions = {
  text: string
  tone?: 'neutral' | 'success' | 'error'
}

export const ToastContext = createContext<(toast: ToastOptions) => void>(
  () => {},
)

export function useToast() {
  return useContext(ToastContext)
}
