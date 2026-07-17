import { useEffect, useState, useCallback } from 'react'
import { db } from './db'

// Runs an async loader, re-running whenever the backend signals a change
// (Supabase realtime, or local cross-tab events). Returns [data, reload].
export function useLive(loader, deps = []) {
  const [data, setData] = useState(null)
  const reload = useCallback(() => {
    Promise.resolve(loader()).then(setData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    reload()
    const off = db.onChange(reload)
    return off
  }, [reload])

  return [data, reload]
}
