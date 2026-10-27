import { useEffect, useState } from 'react'
import type { Lang } from '../api/types'

const KEY = 'teestaguard-lang'

function readStored(): Lang {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'en' || stored === 'hi' || stored === 'ne') return stored
  } catch {
    // localStorage unavailable (private mode, etc.)
  }
  return 'en'
}

export function useLanguage(): [Lang, (lang: Lang) => void] {
  const [lang, setLang] = useState<Lang>(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      // ignore
    }
  }, [lang])

  return [lang, setLang]
}
