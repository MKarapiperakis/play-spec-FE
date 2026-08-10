import { useCallback, useState } from 'react'

const STORAGE_KEY = 'playspec.jobId'

/**
 * Persists the current generate job id in localStorage, so a page reload (or
 * reopening the tab later) can resume polling the same job instead of losing
 * track of it — the job id itself is the only credential PlaySpec's API
 * needs (see backend's jobStore.js), so this is all "reattaching" requires.
 */
export function useJobId() {
  const [jobId, setJobIdState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))

  const setJobId = useCallback((next: string | null) => {
    if (next) localStorage.setItem(STORAGE_KEY, next)
    else localStorage.removeItem(STORAGE_KEY)
    setJobIdState(next)
  }, [])

  return { jobId, setJobId }
}
