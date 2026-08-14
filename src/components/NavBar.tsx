import { MoreHorizontal } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ThemeToggle'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/generate', label: 'Generate' },
  { to: '/about', label: 'About' },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
  )

export function NavBar() {
  return (
    <header className="border-border/60 sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Two dedicated assets, not one recolored via CSS — logo.png's
            navy wordmark reads fine on light backgrounds but disappears on
            dark ones, so logo_dark.png (its own opaque near-black backing
            baked in, matching the dark theme's background) takes over there
            instead. dark:hidden/dark:block make the swap immediate and
            flash-free, since it's resolved by the same CSS class the rest
            of dark mode already relies on — no JS/theme-state needed here. */}
        <NavLink to="/" aria-label="PlaySpec home">
          <img src="/logo.png" alt="PlaySpec" className="h-8 w-auto dark:hidden" />
          <img src="/logo_dark.png" alt="PlaySpec" className="hidden h-8 w-auto dark:block" />
        </NavLink>

        <div className="flex items-center gap-1">
          {/* Full link row on larger screens... */}
          <nav className="hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ...collapsed into a single menu below that breakpoint. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Open navigation menu" className="sm:hidden">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="sm:hidden">
              {LINKS.map((link) => (
                <DropdownMenuItem key={link.to} asChild>
                  <NavLink to={link.to} end={link.end} className={navLinkClass}>
                    {link.label}
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
