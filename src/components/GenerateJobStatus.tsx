import { useState } from 'react'
import type { GenerateJobStatus as JobStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { downloadBlob } from '@/lib/download'
import { CheckCircle2, Download, Loader2, XCircle } from 'lucide-react'

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
            Start over
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // status.status === 'done'
  return (
    <Alert>
      <CheckCircle2 className="size-4" />
      <AlertTitle>Your test project is ready</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p>{status.filename}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="w-fit"
            onClick={() => {
              downloadBlob(status.blob, status.filename)
              setDownloaded(true)
            }}
          >
            <Download className="size-4" />
            {downloaded ? 'Download again' : 'Download'}
          </Button>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onReset}>
            Start over
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
