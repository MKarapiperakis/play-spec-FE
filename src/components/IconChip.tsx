import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface IconChipProps {
  icon: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS = {
  sm: 'size-8 [&_svg]:size-4',
  md: 'size-9 [&_svg]:size-5',
  lg: 'size-12 [&_svg]:size-6',
}

/** A colored rounded-square icon badge, used throughout the generate/validate UI's section headers and stats. */
export function IconChip({ icon, className, size = 'md' }: IconChipProps) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-lg', SIZE_CLASS[size], className)}>
      {icon}
    </span>
  )
}
