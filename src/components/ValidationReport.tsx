import { useRef } from 'react'
import type { CategoryStatus, Severity, ValidateResult, ValidationCategory } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const SEVERITY_BADGE: Record<Severity, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
  good: { variant: 'default', label: 'Good' },
  medium: { variant: 'secondary', label: 'Medium' },
  bad: { variant: 'destructive', label: 'Bad' },
}

// Tints the score panel to match the overall verdict — a lighter-weight
// echo of the same severity color used for the badge next to it.
const SEVERITY_PANEL: Record<Severity, string> = {
  good: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30',
  medium: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
  bad: 'border-destructive/30 bg-destructive/5 dark:bg-destructive/10',
}

const CATEGORY_ICON: Record<CategoryStatus, { Icon: typeof CheckCircle2; className: string }> = {
  pass: { Icon: CheckCircle2, className: 'text-emerald-600 dark:text-emerald-500' },
  warning: { Icon: TriangleAlert, className: 'text-amber-600 dark:text-amber-500' },
  error: { Icon: AlertCircle, className: 'text-destructive' },
}

const CATEGORY_BADGE: Record<CategoryStatus, { variant: 'default' | 'secondary' | 'destructive'; className?: string }> = {
  pass: { variant: 'default', className: 'bg-emerald-600 text-white dark:bg-emerald-500' },
  warning: { variant: 'secondary', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  error: { variant: 'destructive' },
}

// Mirrors the five checks in src/parser/validateSpec.js's buildCategories —
// keyed by the same category id the backend sends, so a category the
// backend adds later just silently gets no tooltip instead of breaking.
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'schema-structure':
    "Checks the spec's overall structural validity against the OpenAPI/JSON Schema, and whether there's anything (GET/POST/PUT/PATCH/DELETE operations) to generate tests from at all.",
  'security-definitions':
    'Flags security scheme types the generator can\'t authenticate with, and operations whose "security" references a scheme name that was never declared under components.securitySchemes — a common typo.',
  'response-examples':
    "Flags operations whose success response has no example or schema to build a response-shape assertion from. The generated test still runs, it just only checks the HTTP status code.",
  'path-parameters':
    'Flags path template placeholders (e.g. the "{id}" in "/pets/{id}") that aren\'t declared in the parameters list. This one blocks generation — the resulting test can never pass.',
  'generation-readiness':
    'Lower-stakes checks that affect output quality rather than correctness: no base URL declared, operations missing a summary, and tags used but not listed in the spec\'s own top-level "tags" catalog.',
}

function statusLabel(category: ValidationCategory): string {
  if (category.status === 'pass') return 'Passed'
  const n = category.issues.length
  const noun = category.status === 'error' ? 'error' : 'warning'
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}

function CategoryRow({ category }: { category: ValidationCategory }) {
  const { Icon, className } = CATEGORY_ICON[category.status]
  const badge = CATEGORY_BADGE[category.status]
  const itemRef = useRef<HTMLDivElement>(null)

  const description = CATEGORY_DESCRIPTIONS[category.id]

  // Radix's Accordion updates data-state synchronously with its own click
  // handling, so checking it a tick later here only fires once the category
  // just opened — never on close, and never for the info-icon click above
  // (which already stopped its own propagation before this ever runs).
  const scrollIntoViewIfJustOpened = () => {
    setTimeout(() => {
      if (itemRef.current?.getAttribute('data-state') === 'open') {
        itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }, 0)
  }

  const header = (
    <div className="flex flex-1 items-center gap-3">
      <Icon className={cn('size-4 shrink-0', className)} />
      <span className="font-medium">{category.label}</span>
      {description && (
        <Tooltip>
          <TooltipTrigger asChild>
            {/* A <span role="button">, not a real <button> — this sits
                inside the accordion trigger's own <button>, and a <button>
                can't legally nest inside another one. stopPropagation still
                matters regardless of element type: without it, a click here
                would also toggle the category open/closed. */}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground cursor-default"
              aria-label={`What does "${category.label}" check?`}
            >
              <Info className="size-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{description}</TooltipContent>
        </Tooltip>
      )}
      <Badge variant={badge.variant} className={cn('ml-auto mr-2', badge.className)}>
        {statusLabel(category)}
      </Badge>
    </div>
  )

  if (category.issues.length === 0) {
    return (
      <div className="flex items-center rounded-lg border px-4 py-3">
        {header}
      </div>
    )
  }

  return (
    <AccordionItem ref={itemRef} value={category.id} className="rounded-lg border px-4 not-last:border-b">
      <AccordionTrigger className="hover:no-underline" onClick={scrollIntoViewIfJustOpened}>
        {header}
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-2">
          {category.issues.map((issue, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
                issue.severity === 'error'
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400',
              )}
            >
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export function ValidationReport({ result }: { result: ValidateResult }) {
  const badge = SEVERITY_BADGE[result.severity]

  return (
    <div className="flex flex-col gap-4">
      <div className={cn('flex items-center gap-3 rounded-lg border px-4 py-3', SEVERITY_PANEL[result.severity])}>
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <span className="text-sm">
          Score: <span className="font-semibold">{result.score}/100</span>
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground cursor-default text-sm underline decoration-dotted underline-offset-4">
              {result.canGenerate ? 'Can generate' : 'Not recommended to generate'}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {result.canGenerate
              ? 'No blocking errors were found — generated tests should run without structural issues.'
              : 'Blocking errors were found in this spec. You can still generate a test project, but expect broken or incomplete tests until the errors above are fixed.'}
          </TooltipContent>
        </Tooltip>
      </div>

      {result.categories ? (
        <Accordion type="multiple" className="flex flex-col gap-2">
          {result.categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </Accordion>
      ) : (
        // No parsed spec to check categories against (e.g. the file wasn't
        // valid YAML/JSON at all) — fall back to the one or two flat errors.
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
    </div>
  )
}
