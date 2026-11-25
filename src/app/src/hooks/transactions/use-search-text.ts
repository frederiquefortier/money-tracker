import { useEffect, useRef, useState } from 'react'

/** The search as typed, sent to the address once typing pauses. */
export function useSearchText(sent: string, send: (text: string) => void) {
  const [text, setText] = useState(sent)
  const latest = useRef(send)
  latest.current = send
  useEffect(() => {
    if (text.trim() === sent) return
    const timer = setTimeout(() => latest.current(text), 300)
    return () => clearTimeout(timer)
  }, [text, sent])
  return [text, setText] as const
}
