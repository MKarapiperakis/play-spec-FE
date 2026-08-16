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

const RECONNECT_DELAY_MS = 2000

/**
 * Owns the full lifecycle of a generate job: kicking one off, persisting its
 * id + owning token (via useJobId) so a reload resumes watching it, and
 * tracking status via Server-Sent Events (GET /generate/http/:jobId/events)
 * rather than polling.
 *
 * This deliberately does NOT use the native EventSource API — the backend
 * now requires the same Bearer token that created the job to read its
 * status back (see jobStore.js's isOwner), and EventSource has no way to
 * attach custom headers. fetch() + a manual line reader gives full header
 * control; unlike useQueueStats.ts's version of this same pattern, this one
 * stops reconnecting for good once a terminal state (done/failed/not-found)
 * arrives, matching how the old EventSource-based version closed its
 * connection at that point too.
 */
export function useGenerateJob() {
  const { jobId, token, setJob } = useJobId()
  const [status, setStatus] = useState<GenerateJobStatus | undefined>(undefined)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)

  useEffect(() => {
    setStatus(undefined)
    if (jobId === null || token === null) return

    setIsLoadingStatus(true)
    let cancelled = false

    async function watch() {
      while (!cancelled) {
        try {
          const res = await fetch(`${API_BASE_URL}/generate/http/${encodeURIComponent(jobId as string)}/events`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok || !res.body) throw new Error(`SSE connection failed: HTTP ${res.status}`)

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (!cancelled) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            const frames = buffer.split('\n\n')
            buffer = frames.pop() ?? ''
            for (const frame of frames) {
              const dataLine = frame.split('\n').find((line) => line.startsWith('data: '))
              if (!dataLine) continue
              const payload = JSON.parse(dataLine.slice('data: '.length)) as JobEvent
              if (cancelled) return
              setIsLoadingStatus(false)

              if (payload.status === 'pending') {
                setStatus({ status: 'pending' })
                continue
              }

              // Terminal: the server closes its end right after sending
              // this — stop watching entirely rather than looping back to
              // reconnect, same as the old EventSource version closing itself.
              if (payload.status === 'done') {
                getGenerateJob(jobId as string, token as string)
                  .then((full) => {
                    if (!cancelled) setStatus(full)
                  })
                  .catch(() => {
                    if (!cancelled) setStatus({ status: 'failed', error: 'Generated, but the file could not be downloaded. Try again.' })
                  })
              } else {
                setStatus(payload)
              }
              return
            }
          }
        } catch {
          // Connection never opened, or dropped mid-stream while still
          // pending — fall through to the reconnect delay below, same as
          // EventSource's own built-in retry would have done.
        }
        if (!cancelled) await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS))
      }
    }

    watch()
    return () => {
      cancelled = true
    }
  }, [jobId, token])

  // The job id is only ever a *hint* to reattach to — if the server no
  // longer knows about it (expired, or never existed — and now also "wrong
  // token", which is reported identically), stop tracking it.
  useEffect(() => {
    if (status?.status === 'not-found') setJob(null)
  }, [status, setJob])

  useTitleAlert(
    status?.status === 'done'
      ? '✅ Test project ready — PlaySpec'
      : status?.status === 'failed'
        ? '⚠️ Generation failed — PlaySpec'
        : null,
  )

  const startMutation = useMutation({
    mutationFn: ({ file, options, generateToken }: { file: File; options?: GenerateOptions; generateToken?: string }) =>
      startGenerate(file, options, generateToken),
    onSuccess: (result, variables) => {
      setJob({ jobId: result.jobId, token: variables.generateToken ?? '' })
    },
  })

  const reset = () => {
    setJob(null)
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
