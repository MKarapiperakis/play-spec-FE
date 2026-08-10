import { useQueueStats } from '@/hooks/useQueueStats'
import { Badge } from '@/components/ui/badge'

export function QueueStatusBadge() {
  const { data } = useQueueStats()
  if (!data) return null

  return (
    <Badge variant="outline" title={`${data.activeUsers} user(s) currently generating`}>
      {data.running}/{data.limits.concurrency} running
      {data.waiting > 0 ? ` · ${data.waiting} waiting` : ''}
    </Badge>
  )
}
