import { useEffect, useState } from 'react'
import { API_BASE_URL } from '@/lib/api'
import type { QueueStats } from '@/lib/types'

/**
 * Live queue stats pushed over Server-Sent Events (GET /queue/events) rather
 * than polled — the backend already knows the exact moment the numbers
 * change (see generateQueue.js), so there's no reason to keep asking on a
 * timer. EventSource reconnects on its own if the connection drops.
 */
export function useQueueStats() {
  const [data, setData] = useState<QueueStats | undefined>(undefined)

  useEffect(() => {
    const source = new EventSource(`${API_BASE_URL}/queue/events`)
    source.onmessage = (event) => {
      setData(JSON.parse(event.data))
    }
    return () => source.close()
  }, [])

  return { data }
}
