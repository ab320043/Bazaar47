// app/staff/components/StaffMobileTopBar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
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
// NAV CONFIG (duplicated from sidebar — keep in sync)
// ============================================

interface NavItem {
  href: string
  label: string
  icon: typeof Calendar
}

const NAV_ITEMS: NavItem[] = [
  { href: '/staff/shifts',    label: 'My Shifts',    icon: Calendar },
  { href: '/staff/payroll',   label: 'Payroll',      icon: DollarSign },
  { href: '/staff/checklist', label: 'My Checklist', icon: CheckSquare },
  { href: '/staff/notes',     label: 'Notes',        icon: FileText },
  { href: '/staff/profile',   label: 'Profile',      icon: User },
]

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

export function StaffMobileTopBar({ staff }: { staff: StaffMember }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const displayName = staff.preferredName?.trim() || staff.name

  return (
    <>
      {/* Fixed top bar — visible only below sm: */}
      <div className="sm:hidden fixed top-0 left-0 right-0 h-14 bg-rosewood text-plaster z-50 flex items-center justify-between px-3">
        <button
          onClick={() => setOpen(true)}
          className="p-2 -ml-1 rounded-lg hover:bg-plaster/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/staff/shifts" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-chartreuse text-grove flex items-center justify-center font-host-grotesk font-bold text-xs">
            {initialsFor(displayName)}
          </div>
          <span className="font-host-grotesk font-semibold text-sm">
            {displayName}
          </span>
        </Link>

        <div className="w-9" aria-hidden="true" />
      </div>

      {/* Spacer so page content doesn't hide under the fixed bar */}
      <div className="sm:hidden h-14" aria-hidden="true" />

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden fixed inset-0 bg-rosewood/60 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="sm:hidden fixed left-0 top-0 h-full w-72 bg-rosewood text-plaster z-50 flex flex-col"
            >
              <div className="p-4 border-b border-plaster/10 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-chartreuse text-grove flex items-center justify-center font-host-grotesk font-bold text-sm shrink-0">
                    {initialsFor(displayName)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-host-grotesk font-bold text-sm truncate">
                      {displayName}
                    </p>
                    <p className="font-host-grotesk text-xs text-plaster/50 truncate">
                      {roleLabel(staff.primaryRole)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-plaster/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                        isActive
                          ? 'bg-plaster/20 text-plaster'
                          : 'text-plaster/70 hover:bg-plaster/10 hover:text-plaster'
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="p-3 border-t border-plaster/10 shrink-0">
                <StaffLogoutButton showLabel />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}