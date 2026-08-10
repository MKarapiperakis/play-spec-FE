import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SpecUploader } from '@/components/SpecUploader'
import { ValidationReport } from '@/components/ValidationReport'
import { GenerateJobStatus } from '@/components/GenerateJobStatus'
import { QueueStatusBadge } from '@/components/QueueStatusBadge'
import { useValidateSpec } from '@/hooks/useValidateSpec'
import { useGenerateJob } from '@/hooks/useGenerateJob'
import { ApiError } from '@/lib/api'

export function Generate() {
  const validateMutation = useValidateSpec()
  const generateJob = useGenerateJob()

  const handleValidate = (file: File) => {
    validateMutation.mutate(
      { file },
      {
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : 'Validation failed.')
        },
      },
    )
  }

  const handleGenerate = (file: File, options: { projectName?: string; baseUrl?: string }) => {
    generateJob.start(
      { file, options },
      {
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            toast.error('You already have a generate job in progress.')
          } else if (err instanceof ApiError && err.status === 503) {
            toast.error('Server is busy right now — try again shortly.')
          } else {
            toast.error(err instanceof ApiError ? err.message : 'Failed to start generation.')
          }
        },
      },
    )
  }

  const hasActiveJob = generateJob.jobId !== null

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Generate tests</h1>
        <QueueStatusBadge />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Upload a spec</CardTitle>
          <CardDescription>
            Validate an OpenAPI/Swagger spec, or generate a Playwright test project from it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpecUploader
            onValidate={handleValidate}
            onGenerate={handleGenerate}
            isValidating={validateMutation.isPending}
            isGenerating={generateJob.isStarting}
            generateDisabled={hasActiveJob}
          />
        </CardContent>
      </Card>

      {validateMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Validation result</CardTitle>
          </CardHeader>
          <CardContent>
            <ValidationReport result={validateMutation.data} />
          </CardContent>
        </Card>
      )}

      {hasActiveJob && (
        <Card>
          <CardHeader>
            <CardTitle>Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <GenerateJobStatus
              status={generateJob.status}
              isLoading={generateJob.isLoadingStatus}
              onReset={generateJob.reset}
            />
          </CardContent>
        </Card>
      )}
    </main>
  )
}
