import { useQuery } from '@tanstack/react-query'
import { getQueueStats } from '@/lib/api'

const REFRESH_MS = 5000

export function useQueueStats() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: getQueueStats,
    refetchInterval: REFRESH_MS,
  })
}
