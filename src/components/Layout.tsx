import { Outlet } from 'react-router-dom'
import { NavBar } from '@/components/NavBar'
import { PrivacyNotice } from '@/components/PrivacyNotice'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Layout() {
  return (
    <TooltipProvider>
      <div className="min-h-svh">
        <NavBar />
        <Outlet />
        <PrivacyNotice />
      </div>
    </TooltipProvider>
  )
}
