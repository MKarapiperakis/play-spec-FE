import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { API_BASE_URL, getGenerateJob, startGenerate, type GenerateOptions } from '@/lib/api'
import type { GenerateJobStatus } from '@/lib/types'
import { useJobId } from './useJobId'
import { useTitleAlert } from './useTitleAlert'

// What the server actually pushes over SSE — no blob (see jobStore.js's
// toPublicJob); once this reports "done" we make one normal GET to fetch
// the file itself, same as the old polling path did on its last poll.
type JobEvent = { status: 'pending' } | { status: 'done'; filename: string } | { status: 'failed'; error: string } | { status: 'not-found' }

/**
 * Owns the full lifecycle of a generate job: kicking one off, persisting its
 * id (via useJobId) so a reload resumes watching it, and tracking status via
 * Server-Sent Events (GET /generate/http/:jobId/events) rather than polling
 * — the connection just sits open until the backend pushes a change. A
 * stale/expired job (the server reports "not-found") clears itself
 * automatically.
 */
export function useGenerateJob() {
  const { jobId, setJobId } = useJobId()
  const [status, setStatus] = useState<GenerateJobStatus | undefined>(undefined)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)

  useEffect(() => {
    setStatus(undefined)
    if (jobId === null) return

    setIsLoadingStatus(true)
    let cancelled = false
    const source = new EventSource(`${API_BASE_URL}/generate/http/${encodeURIComponent(jobId)}/events`)

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as JobEvent
      setIsLoadingStatus(false)

      if (payload.status === 'pending') {
        setStatus({ status: 'pending' })
        return
      }

      // Terminal states: the server closes its end right after sending
      // this, but close our side too so the browser never tries to
      // auto-reconnect a stream that's intentionally finished.
      source.close()

      if (payload.status === 'done') {
        // SSE only signalled completion — fetch the actual zip the normal way.
        getGenerateJob(jobId)
          .then((full) => {
            if (!cancelled) setStatus(full)
          })
          .catch(() => {
            if (!cancelled) setStatus({ status: 'failed', error: 'Generated, but the file could not be downloaded. Try again.' })
          })
      } else {
        setStatus(payload)
      }
    }

    return () => {
      cancelled = true
      source.close()
    }
  }, [jobId])

  // The job id is only ever a *hint* to reattach to — if the server no
  // longer knows about it (expired, or never existed), stop tracking it.
  useEffect(() => {
    if (status?.status === 'not-found') setJobId(null)
  }, [status, setJobId])

  useTitleAlert(
    status?.status === 'done'
      ? '✅ Test project ready — PlaySpec'
      : status?.status === 'failed'
        ? '⚠️ Generation failed — PlaySpec'
        : null,
  )

  const startMutation = useMutation({
    mutationFn: ({ file, options }: { file: File; options?: GenerateOptions }) =>
      startGenerate(file, options),
    onSuccess: (result) => {
      setJobId(result.jobId)
    },
  })

  const reset = () => {
    setJobId(null)
    setStatus(undefined)
  }

  // True only while a job is genuinely in flight server-side — the POST
  // itself, or a job whose status hasn't resolved yet or is still
  // "pending". Deliberately NOT just "a jobId exists": once a job reaches
  // done/failed/not-found, there's no reason to keep blocking a new
  // Generate click waiting on an explicit "Start over".
  const isPending =
    startMutation.isPending || (jobId !== null && (isLoadingStatus || status?.status === 'pending' || status === undefined))

  return {
    jobId,
    status,
    isLoadingStatus,
    isPending,
    start: startMutation.mutate,
    isStarting: startMutation.isPending,
    startError: startMutation.error,
    reset,
  }
}
