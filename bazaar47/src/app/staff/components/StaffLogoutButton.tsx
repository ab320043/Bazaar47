'use client'

import { LogOut } from 'lucide-react'

export function StaffLogoutButton({ showLabel }: { showLabel?: boolean } = {}) {
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/staff/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        window.location.href = '/staff/login'
      }
    } catch (error) {
      console.error('Staff logout error:', error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-plaster/10 transition-all text-sm text-plaster/70 hover:text-plaster w-full"
    >
      <LogOut className="w-5 h-5 shrink-0" />
      <span className={showLabel ? 'block' : 'hidden md:block'}>Sign out</span>
    </button>
  )
}