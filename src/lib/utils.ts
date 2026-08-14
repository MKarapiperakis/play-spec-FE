import type { SyntheticEvent } from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Copies `text` to the clipboard, returning whether it succeeded (e.g. false if the page isn't in a secure/focused context clipboard access requires). */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * `<details>` onToggle handler: when an explanatory collapsible section
 * (endpoints, auth methods, schemas, ...) is opened, scrolls so its full
 * content — not just its `<summary>` — ends up in view, instead of leaving
 * the newly-revealed bottom half below the fold. No-ops on close.
 */
export function scrollIntoViewOnOpen(e: SyntheticEvent<HTMLDetailsElement>) {
  if (e.currentTarget.open) {
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }
}
