import { useState } from 'react'
import type { GenerateJobStatus as JobStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { downloadBlob } from '@/lib/download'
import { CheckCircle2, Download, Loader2, RotateCcw, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GenerateJobStatusProps {
  status: JobStatus | undefined
  isLoading: boolean
  onReset: () => void
}

export function GenerateJobStatus({ status, isLoading, onReset }: GenerateJobStatusProps) {
  const [downloaded, setDownloaded] = useState(false)

  if (isLoading || !status || status.status === 'pending') {
    return (
      <Alert>
        <Loader2 className="size-4 animate-spin" />
        <AlertTitle>Generating your test project…</AlertTitle>
        <AlertDescription>This can take a little while — feel free to leave and check back later.</AlertDescription>
      </Alert>
    )
  }

  if (status.status === 'failed') {
    return (
      <Alert variant="destructive">
        <XCircle className="size-4" />
        <AlertTitle>Generation failed</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <p>{status.error}</p>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onReset}>
            <RotateCcw className="size-4" />
            Start over
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (status.status === 'not-found') {
    return (
      <Alert variant="destructive">
        <XCircle className="size-4" />
        <AlertTitle>Job not found</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <p>It may have expired. Start a new generation.</p>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onReset}>
            <RotateCcw className="size-4" />
            Start over
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // status.status === 'done'
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4',
        'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30',
      )}
    >
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-5" />
        <span className="font-medium">Your test project is ready</span>
      </div>
      <p className="text-muted-foreground truncate text-sm">{status.filename}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="w-fit bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          onClick={() => {
            downloadBlob(status.blob, status.filename)
            setDownloaded(true)
          }}
        >
          <Download className="size-4" />
          {downloaded ? 'Download again' : 'Download'}
        </Button>
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onReset}>
          <RotateCcw className="size-4" />
          Start over
        </Button>
      </div>
    </div>
  )
}
