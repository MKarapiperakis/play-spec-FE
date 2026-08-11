import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getGenerateJob, startGenerate, type GenerateOptions } from '@/lib/api'
import { useJobId } from './useJobId'

const POLL_INTERVAL_MS = 1500

/**
 * Owns the full lifecycle of a generate job: kicking one off, persisting its
 * id (via useJobId) so a reload resumes polling it, and polling status while
 * pending. A stale/expired job (404 from the API) clears itself automatically.
 */
export function useGenerateJob() {
  const { jobId, setJobId } = useJobId()
  const queryClient = useQueryClient()

  const statusQuery = useQuery({
    queryKey: ['generate-job', jobId],
    queryFn: () => getGenerateJob(jobId as string),
    enabled: jobId !== null,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? POLL_INTERVAL_MS : false),
  })

  // The job id is only ever a *hint* to reattach to — if the server no
  // longer knows about it (expired, or never existed), stop tracking it.
  useEffect(() => {
    if (statusQuery.data?.status === 'not-found') setJobId(null)
  }, [statusQuery.data, setJobId])

  const startMutation = useMutation({
    mutationFn: ({ file, options }: { file: File; options?: GenerateOptions }) =>
      startGenerate(file, options),
    onSuccess: (result) => {
      setJobId(result.jobId)
      queryClient.invalidateQueries({ queryKey: ['generate-job', result.jobId] })
    },
  })

  const reset = () => setJobId(null)

  // True only while a job is genuinely in flight server-side — the POST
  // itself, or a job whose status hasn't resolved yet or is still
  // "pending". Deliberately NOT just "a jobId exists": once a job reaches
  // done/failed/not-found, there's no reason to keep blocking a new
  // Generate click waiting on an explicit "Start over".
  const isPending =
    startMutation.isPending || (jobId !== null && (statusQuery.isLoading || statusQuery.data?.status === 'pending'))

  return {
    jobId,
    status: statusQuery.data,
    isLoadingStatus: statusQuery.isLoading,
    isPending,
    start: startMutation.mutate,
    isStarting: startMutation.isPending,
    startError: startMutation.error,
    reset,
  }
}
