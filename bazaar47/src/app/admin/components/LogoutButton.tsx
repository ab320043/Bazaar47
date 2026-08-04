'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-plaster/10 transition-all text-sm w-full"
    >
      <LogOut className="w-5 h-5" />
      <span className="hidden md:block">Logout</span>
    </button>
  )
}