// app/staff/components/StaffLogoutButton.tsx
'use client'

import { LogOut } from 'lucide-react'

export function StaffLogoutButton() {
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/staff/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        // Hard redirect so the server drops the cookie session cleanly.
        window.location.href = '/staff/login'
      }
    } catch (error) {
      console.error('Staff logout error:', error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 bg-white hover:bg-white/80 text-rosewood/60 hover:text-rosewood px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all shadow-sm"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  )
}