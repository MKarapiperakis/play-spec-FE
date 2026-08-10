import type { Severity, ValidateResult } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'

const SEVERITY_BADGE: Record<Severity, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
  good: { variant: 'default', label: 'Good' },
  medium: { variant: 'secondary', label: 'Medium' },
  bad: { variant: 'destructive', label: 'Bad' },
}

export function ValidationReport({ result }: { result: ValidateResult }) {
  const badge = SEVERITY_BADGE[result.severity]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <span className="text-muted-foreground text-sm">Score {result.score}/100</span>
        <span className="text-muted-foreground text-sm">
          {result.canGenerate ? 'Can generate' : 'Cannot generate'}
        </span>
      </div>

      {result.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{result.errors.length} error(s)</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {result.errors.map((e, i) => (
                <li key={i}>{e.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {result.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>{result.warnings.length} warning(s)</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {result.warnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {result.errors.length === 0 && result.warnings.length === 0 && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>No issues found</AlertTitle>
        </Alert>
      )}

      {result.summary && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <SummaryStat label="Title" value={result.summary.title ?? '—'} />
            <SummaryStat label="Spec version" value={result.summary.specVersion ?? '—'} />
            <SummaryStat label="Paths" value={result.summary.pathCount} />
            <SummaryStat label="Operations" value={result.summary.operationCount} />
          </div>
          {result.summary.securitySchemes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.summary.securitySchemes.map((s) => (
                <Badge key={s.name} variant="outline">
                  {s.name} · {s.type}
                </Badge>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
