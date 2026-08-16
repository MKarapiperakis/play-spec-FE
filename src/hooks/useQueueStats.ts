import { useEffect, useState } from 'react'
import { API_BASE_URL, basicAuthHeaders } from '@/lib/api'
import type { QueueStats } from '@/lib/types'

const RECONNECT_DELAY_MS = 2000

/**
 * Live queue stats pushed over Server-Sent Events (GET /queue/events) rather
 * than polled — the backend already knows the exact moment the numbers
 * change (see generateQueue.js), so there's no reason to keep asking on a
 * timer.
 *
 * This deliberately does NOT use the native EventSource API — /queue/events
 * requires HTTP Basic Auth (see basicAuth.js), and EventSource has no way
 * to attach custom headers to its request. fetch() + a manual line reader
 * gives full header control and reproduces EventSource's behavior closely
 * enough for this: parse "data: {...}\n\n" frames, auto-reconnect on drop.
 */
export function useQueueStats() {
  const [data, setData] = useState<QueueStats | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    async function connect() {
      while (!cancelled) {
        try {
          const res = await fetch(`${API_BASE_URL}/queue/events`, { headers: basicAuthHeaders() })
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
              if (dataLine) setData(JSON.parse(dataLine.slice('data: '.length)))
            }
          }
        } catch {
          // Connection never opened, or dropped mid-stream — fall through
          // to the reconnect delay below, same as EventSource would.
        }
        if (!cancelled) await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS))
      }
    }

    connect()
    return () => {
      cancelled = true
    }
  }, [])

  return { data }
}
