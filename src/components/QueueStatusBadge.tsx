import { useQueueStats } from "@/hooks/useQueueStats";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function QueueStatusBadge() {
  const { data } = useQueueStats();
  if (!data) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="cursor-default">
          {data.running}/{data.limits.concurrency} running
          {data.waiting > 0 ? ` · ${data.waiting} waiting` : ""}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        PlaySpec limits how many test-generation jobs can run at once so the
        service stays fair for everyone. {data.activeUsers} user(s) currently
        generating
      </TooltipContent>
    </Tooltip>
  );
}
