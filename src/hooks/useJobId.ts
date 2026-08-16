import { useCallback, useState } from 'react'

const STORAGE_KEY = 'playspec.job'

interface StoredJob {
  jobId: string
  /** The Bearer token that created this job — the backend now requires the exact same one back to read it (see jobStore.js's isOwner), so this has to be persisted alongside the id to survive a reload. */
  token: string
}

/**
 * Persists the current generate job (id + owning token) in localStorage, so
 * a page reload (or reopening the tab later) can resume watching the same
 * job instead of losing track of it.
 */
export function useJobId() {
  const [job, setJobState] = useState<StoredJob | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed?.jobId === 'string' && typeof parsed?.token === 'string') return parsed as StoredJob
    } catch {
      // Stale value from before this format (a bare jobId string, not JSON)
      // or otherwise corrupt — either way there's no token to pair it with,
      // so just treat it as no active job rather than trying to salvage it.
    }
    return null
  })

  const setJob = useCallback((next: StoredJob | null) => {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
    setJobState(next)
  }, [])

  return { jobId: job?.jobId ?? null, token: job?.token ?? null, setJob }
}
