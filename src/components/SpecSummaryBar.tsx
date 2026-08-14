import type { ReactNode } from 'react'
import type { SchemaInfo, SecuritySchemeInfo, ValidationSummary } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { EndpointsByMethod } from '@/components/EndpointsByMethod'
import { IconChip } from '@/components/IconChip'
import { CopyButton } from '@/components/CopyButton'
import { scrollIntoViewOnOpen } from '@/lib/utils'
import { FileText, GitBranch, Share2, ShieldCheck, Tag } from 'lucide-react'

function StatItem({ icon, iconClassName, label, value }: { icon: ReactNode; iconClassName: string; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <IconChip icon={icon} className={iconClassName} size="sm" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate font-medium" title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}>
          {value}
        </p>
      </div>
    </div>
  )
}

const SCHEME_TYPE_BADGE_CLASS: Record<string, string> = {
  'http-bearer': 'bg-amber-600 text-white dark:bg-amber-500',
  'http-basic': 'bg-orange-600 text-white dark:bg-orange-500',
  apiKey: 'bg-cyan-600 text-white dark:bg-cyan-500',
  unsupported: 'bg-zinc-500 text-white dark:bg-zinc-600',
}

function AuthMethodsList({ schemes }: { schemes: SecuritySchemeInfo[] }) {
  if (schemes.length === 0) return null

  return (
    <details className="text-sm" onToggle={scrollIntoViewOnOpen}>
      <summary className="cursor-pointer select-none font-medium">Auth methods ({schemes.length})</summary>
      <ul className="mt-3 flex flex-col gap-1">
        {schemes.map((scheme) => (
          <li key={scheme.name} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
            <Badge className={SCHEME_TYPE_BADGE_CLASS[scheme.type] ?? 'bg-zinc-500 text-white dark:bg-zinc-600'}>
              {scheme.type}
            </Badge>
            <span>{scheme.name}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

// One collapsible entry per schema, nested inside the outer "Schemas (N)"
// list, so the pretty-printed JSON only takes up space once expanded —
// keeps a spec with dozens of schemas from turning the summary into a wall
// of text by default.
function SchemasList({ schemas }: { schemas: SchemaInfo[] | undefined }) {
  if (!schemas || schemas.length === 0) return null

  return (
    <details className="text-sm" onToggle={scrollIntoViewOnOpen}>
      <summary className="cursor-pointer select-none font-medium">Schemas ({schemas.length})</summary>
      <div className="mt-3 flex flex-col gap-1">
        {schemas.map((schema) => {
          const json = JSON.stringify(schema.definition, null, 2)
          return (
            <details key={schema.name} className="rounded-lg border px-3 py-2" onToggle={scrollIntoViewOnOpen}>
              <summary className="flex cursor-pointer select-none items-center gap-2 font-mono text-sm">
                <span className="flex-1">{schema.name}</span>
                <CopyButton value={json} label={`Copied "${schema.name}" schema`} />
              </summary>
              <pre className="bg-muted mt-2 max-h-64 overflow-auto rounded-md p-3 font-mono text-xs">{json}</pre>
            </details>
          )
        })}
      </div>
    </details>
  )
}

export function SpecSummaryBar({ summary }: { summary: ValidationSummary }) {
  const endpointTotal = Object.values(summary.endpoints).reduce((sum: number, list) => sum + (list?.length ?? 0), 0)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatItem
            icon={<FileText />}
            iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
            label="Title"
            value={summary.title ?? '—'}
          />
          <StatItem
            icon={<Tag />}
            iconClassName="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
            label="Spec version"
            value={summary.specVersion ?? '—'}
          />
          <StatItem
            icon={<GitBranch />}
            iconClassName="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
            label="Paths"
            value={summary.pathCount}
          />
          <StatItem
            icon={<ShieldCheck />}
            iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            label="Auth methods"
            value={summary.securitySchemes.length}
          />
          <StatItem
            icon={<Share2 />}
            iconClassName="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400"
            label="Endpoints"
            value={endpointTotal}
          />
        </div>
        {(endpointTotal > 0 || summary.securitySchemes.length > 0 || (summary.schemas?.length ?? 0) > 0) && <Separator />}
        {endpointTotal > 0 && <EndpointsByMethod endpoints={summary.endpoints} />}
        <AuthMethodsList schemes={summary.securitySchemes} />
        <SchemasList schemas={summary.schemas} />
      </CardContent>
    </Card>
  )
}
