import { toast } from 'sonner'
import type { EndpointInfo } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { copyToClipboard, scrollIntoViewOnOpen } from '@/lib/utils'

const METHOD_ORDER = ['get', 'post', 'put', 'patch', 'delete'] as const

const METHOD_BADGE_CLASS: Record<(typeof METHOD_ORDER)[number], string> = {
  get: 'bg-blue-600 text-white dark:bg-blue-500',
  post: 'bg-emerald-600 text-white dark:bg-emerald-500',
  put: 'bg-amber-600 text-white dark:bg-amber-500',
  patch: 'bg-purple-600 text-white dark:bg-purple-500',
  delete: 'bg-red-600 text-white dark:bg-red-500',
}

export function EndpointsByMethod({
  endpoints,
}: {
  endpoints: Partial<Record<(typeof METHOD_ORDER)[number], EndpointInfo[]>>
}) {
  const methods = METHOD_ORDER.filter((m) => endpoints[m]?.length)
  const total = methods.reduce((sum, m) => sum + (endpoints[m]?.length ?? 0), 0)
  if (total === 0) return null

  return (
    <details className="text-sm" onToggle={scrollIntoViewOnOpen}>
      <summary className="cursor-pointer select-none font-medium">Endpoints ({total})</summary>
      <div className="mt-3 flex flex-col gap-2">
        {methods.map((method) => (
          <details key={method} className="rounded-lg border px-3 py-2" onToggle={scrollIntoViewOnOpen}>
            <summary className="flex cursor-pointer select-none items-center gap-2">
              <Badge className={METHOD_BADGE_CLASS[method]}>{method.toUpperCase()}</Badge>
              <span className="text-muted-foreground text-xs">{endpoints[method]!.length}</span>
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {endpoints[method]!.map((ep) => (
                <li key={ep.path} className="flex flex-wrap items-baseline gap-x-2">
                  <button
                    type="button"
                    title="Click to copy"
                    onClick={async (e) => {
                      e.stopPropagation()
                      const ok = await copyToClipboard(ep.path)
                      if (ok) toast.success(`Copied "${ep.path}"`)
                      else toast.error('Could not copy to clipboard.')
                    }}
                    className="bg-muted hover:bg-muted/70 cursor-pointer rounded px-1 py-0.5 font-mono text-xs transition-colors"
                  >
                    {ep.path}
                  </button>
                  {ep.summary && <span className="text-muted-foreground text-xs">{ep.summary}</span>}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </details>
  )
}
