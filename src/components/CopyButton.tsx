import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { copyToClipboard, cn } from '@/lib/utils'

/**
 * Small icon-only copy-to-clipboard button. Swaps to a checkmark briefly on
 * success. Stops the click from bubbling since this is meant to sit inside
 * clickable/toggle containers (e.g. a <summary>) that shouldn't also react
 * to the click.
 */
export function CopyButton({ value, label = 'Copied to clipboard', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const ok = await copyToClipboard(value)
    if (ok) {
      setCopied(true)
      toast.success(label)
      setTimeout(() => setCopied(false), 1500)
    } else {
      toast.error('Could not copy to clipboard.')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Copy to clipboard"
      className={cn(
        'text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors',
        className,
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}
