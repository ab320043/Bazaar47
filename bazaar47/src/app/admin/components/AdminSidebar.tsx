'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  UserCog,
  LogOut
} from 'lucide-react'
import { LogoutButton } from './LogoutButton'

const navItems = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/staff',
    label: 'Staff',
    icon: Users,
  },
  {
    href: '/admin/staff-dashboard',
    label: 'Staff Dashboard',
    icon: UserCog,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="fixed left-0 top-0 h-full w-16 md:w-56 bg-rosewood text-plaster z-50 flex flex-col">
      <div className="p-4 border-b border-plaster/10 shrink-0">
        <h1 className="font-host-grotesk-narrow font-bold text-sm md:text-lg hidden md:block">
          Bazaar47 Admin
        </h1>
        <span className="font-host-grotesk-narrow font-bold text-sm md:hidden">B47</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${
                isActive 
                  ? 'bg-plaster/20 text-plaster' 
                  : 'text-plaster/70 hover:bg-plaster/10 hover:text-plaster'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="hidden md:block">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-plaster/10 shrink-0">
        <LogoutButton />
      </div>
    </aside>
  )
}