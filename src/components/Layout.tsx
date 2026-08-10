import { Outlet } from 'react-router-dom'
import { NavBar } from '@/components/NavBar'
import { PrivacyNotice } from '@/components/PrivacyNotice'

export function Layout() {
  return (
    <div className="min-h-svh">
      <NavBar />
      <Outlet />
      <PrivacyNotice />
    </div>
  )
}
