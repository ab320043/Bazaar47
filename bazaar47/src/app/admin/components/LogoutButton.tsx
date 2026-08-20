'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        // Redirect to login page
        router.push('/admin/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-plaster/10 transition-all text-sm text-plaster/70 hover:text-plaster w-full"
    >
      <LogOut className="w-5 h-5 shrink-0" />
      <span className="hidden md:block">Logout</span>
    </button>
  )
}