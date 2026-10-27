import { useCallback, useEffect, useRef, useState } from 'react'

interface PollingState<T> {
  data: T | null
  error: Error | null
  loading: boolean
  refresh: () => void
}

export function usePolling<T>(fn: () => Promise<T>, intervalMs: number): PollingState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  const refresh = useCallback(() => {
    fnRef.current()
      .then((result) => {
        setData(result)
        setError(null)
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(() => {
      if (!document.hidden) refresh()
    }, intervalMs)
    return () => clearInterval(timer)
  }, [refresh, intervalMs])

  return { data, error, loading, refresh }
}
