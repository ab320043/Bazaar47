// app/staff/components/StaffSidebar.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  DollarSign,
  CheckSquare,
  FileText,
  User,
} from 'lucide-react'
import type { StaffMember, StaffRole } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'
import { StaffLogoutButton } from './StaffLogoutButton'

// ============================================
// NAV CONFIG
// ============================================

interface NavItem {
  href: string
  label: string
  icon: typeof Calendar
}

const NAV_ITEMS: NavItem[] = [
  { href: '/staff/shifts',    label: 'My Shifts',   icon: Calendar },
  { href: '/staff/payroll',   label: 'Payroll',     icon: DollarSign },
  { href: '/staff/checklist', label: 'My Checklist', icon: CheckSquare },
  { href: '/staff/notes',     label: 'Notes',       icon: FileText },
  { href: '/staff/profile',   label: 'Profile',     icon: User },
]

// ============================================
// HELPERS
// ============================================

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function roleLabel(roleId: StaffRole): string {
  const role = STAFF_ROLES.find((r) => r.id === roleId)
  return role?.label || roleId
}

// ============================================
// MAIN
// ============================================

export function StaffSidebar({ staff }: { staff: StaffMember }) {
  const pathname = usePathname()

  const displayName = staff.preferredName?.trim() || staff.name

  return (
    <aside className="fixed left-0 top-0 h-full w-16 md:w-56 bg-rosewood text-plaster z-40 flex flex-col">
      {/* Staff badge — avatar + name + role */}
      <div className="p-3 md:p-4 border-b border-plaster/10 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-chartreuse text-grove flex items-center justify-center font-host-grotesk font-bold text-sm shrink-0"
            aria-hidden="true"
          >
            {initialsFor(displayName)}
          </div>
          <div className="hidden md:block min-w-0">
            <p className="font-host-grotesk font-bold text-sm truncate">
              {displayName}
            </p>
            <p className="font-host-grotesk text-xs text-plaster/50 truncate">
              {roleLabel(staff.primaryRole)}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 md:p-4 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`)
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

      {/* Logout */}
      <div className="p-2 md:p-4 border-t border-plaster/10 shrink-0">
        <StaffLogoutButton />
      </div>
    </aside>
  )
}