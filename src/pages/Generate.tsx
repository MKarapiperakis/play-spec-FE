import { toast } from 'sonner'
import { ClipboardCheck, Loader2, ShieldAlert, ShieldCheck, ShieldX, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Severity } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IconChip } from '@/components/IconChip'
import { SpecUploader, type ValidateFilters } from '@/components/SpecUploader'
import { ValidationReport } from '@/components/ValidationReport'
import { GenerateJobStatus } from '@/components/GenerateJobStatus'
import { SpecSummaryBar } from '@/components/SpecSummaryBar'
import { QueueStatusBadge } from '@/components/QueueStatusBadge'
import { useValidateSpec } from '@/hooks/useValidateSpec'
import { useGenerateJob } from '@/hooks/useGenerateJob'
import { ApiError } from '@/lib/api'

const SEVERITY_HEADER: Record<Severity, { Icon: typeof ShieldCheck; className: string }> = {
  good: { Icon: ShieldCheck, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  medium: { Icon: ShieldAlert, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  bad: { Icon: ShieldX, className: 'bg-destructive/10 text-destructive' },
}

export function Generate() {
  const validateMutation = useValidateSpec()
  const generateJob = useGenerateJob()

  const handleValidate = (file: File, filters: ValidateFilters) => {
    validateMutation.mutate(
      // includeTags/includeSchemas are always on, independent of any tag
      // filter, so the tag checkboxes in SpecUploader have the full catalog
      // to offer even once you've narrowed validation down to a subset of
      // them, and the summary can always show the full schema list.
      { file, options: { includeTags: true, includeSchemas: true, ...filters } },
      {
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : 'Validation failed.')
        },
      },
    )
  }

  const handleGenerate = (file: File, options: { projectName?: string; baseUrl?: string }) => {
    generateJob.start(
      { file, options, generateToken: validateMutation.data?.generateToken },
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

  // Whether there's a job to *show* (any state, including finished ones) is
  // separate from whether one is *blocking a new Generate click* — only the
  // latter should disable the button, so a finished/failed job doesn't
  // require an explicit "Start over" before you can generate again.
  const hasJob = generateJob.jobId !== null
  const availableTags = validateMutation.data?.summary?.tags?.map((t) => t.name) ?? []
  const hasValidation = validateMutation.isPending || !!validateMutation.data
  const severityHeader = validateMutation.data ? SEVERITY_HEADER[validateMutation.data.severity] : null

  // The backend requires a token /validate hands back (see
  // generateAuth.js) — Generate can't succeed without one, so the button
  // stays locked (with an explanatory tooltip) until a validate call has
  // actually completed, rather than letting the click fail with a 401.
  const generateToken = validateMutation.data?.generateToken
  const generateLocked = !generateToken

  const uploadCard = (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <IconChip
            icon={<UploadCloud />}
            className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
          />
          <div>
            <CardTitle>Input &amp; Generation</CardTitle>
            <CardDescription>
              Validate an OpenAPI/Swagger spec, or generate a Playwright test project from it.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <SpecUploader
          onValidate={handleValidate}
          onGenerate={handleGenerate}
          isValidating={validateMutation.isPending}
          isGenerating={generateJob.isStarting}
          generateDisabled={generateJob.isPending}
          generateLocked={generateLocked}
          availableTags={availableTags}
        />
        {hasJob && (
          <GenerateJobStatus
            status={generateJob.status}
            isLoading={generateJob.isLoadingStatus}
            onReset={generateJob.reset}
          />
        )}
      </CardContent>
    </Card>
  )

  // Shown from the moment Validate is clicked (not just once data arrives) —
  // switching straight to a loading state, in the same card that'll hold the
  // real report, avoids the abrupt pop-in (and the layout jumping to two
  // columns) that happens if nothing renders until the response lands.
  const validationCard = hasValidation && (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <IconChip
            icon={severityHeader ? <severityHeader.Icon /> : <ShieldCheck />}
            className={severityHeader?.className ?? 'bg-muted text-muted-foreground'}
          />
          <CardTitle>Validation result</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!validateMutation.data ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
            <p className="text-muted-foreground text-sm">Validating your spec…</p>
          </div>
        ) : (
          <ValidationReport result={validateMutation.data} />
        )}
      </CardContent>
    </Card>
  )

  const pageTitle = hasValidation ? 'Validation Results Overview' : 'Generate tests'

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconChip
            icon={<ClipboardCheck />}
            className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
            size="lg"
          />
          <h1 className="text-2xl font-semibold">{pageTitle}</h1>
        </div>
        <QueueStatusBadge />
      </header>

      {/*
        One stable tree in both states — only classes change, never the
        wrapping element structure around uploadCard — so SpecUploader never
        unmounts (and loses its selected file / filter state) when a
        validation result appears and the layout widens into two columns.
      */}
      <div
        className={cn(
          'grid grid-cols-1 items-start gap-6',
          validationCard ? 'lg:grid-cols-[380px_1fr]' : 'mx-auto w-full max-w-xl',
        )}
      >
        {uploadCard}
        {validationCard}
      </div>

      {validateMutation.data?.summary && <SpecSummaryBar summary={validateMutation.data.summary} />}
    </main>
  )
}
