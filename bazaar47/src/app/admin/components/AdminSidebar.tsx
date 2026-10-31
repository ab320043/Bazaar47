// app/admin/components/AdminSidebar.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Archive,
  CalendarDays,
  DollarSign,
  Mic2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  UsersRound,
  Clock,
} from 'lucide-react'
import { LogoutButton } from './LogoutButton'

// ============================================
// NAV CONFIG
// ============================================

interface NavChild {
  href: string
  label: string
  icon: typeof LayoutDashboard
  comingSoon?: boolean
}

interface NavGroup {
  id: string
  label: string
  icon: typeof LayoutDashboard
  children: NavChild[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FolderOpen,
    children: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/archive', label: 'Archive', icon: Archive },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    icon: CalendarDays,
    children: [
      { href: '/admin/open-mic', label: 'Open Mic', icon: Mic2 },
      {
        href: '/admin/open-mic/archive',
        label: 'Open Mic Archive',
        icon: Mic2,
        comingSoon: true,
      },
      {
        href: '/admin/big-caf-meetings',
        label: 'Big Caf Meetings',
        icon: CalendarDays,
      },
    ],
  },
  {
    id: 'staff',
    label: 'Staff',
    icon: Users,
    children: [
      { href: '/admin/staff', label: 'Directory', icon: Users },
      { href: '/admin/staff-dashboard', label: 'Activity', icon: Clock },
      { href: '/admin/payroll', label: 'Payroll', icon: DollarSign },
      {
        href: '/admin/staff?staffType=temp',
        label: 'Temp Staff',
        icon: UsersRound,
      },
      {
        href: '/admin/shifts',
        label: 'Shifts & Offers',
        icon: UserCog,
        comingSoon: true,
      },
    ],
  },
]

const STORAGE_KEY = 'admin_sidebar_groups_open'
const openGroupsListeners = new Set<() => void>()

// ============================================
// HELPERS
// ============================================

function loadOpenGroups(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function subscribeOpenGroups(listener: () => void): () => void {
  openGroupsListeners.add(listener)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', listener)
  }
  return () => {
    openGroupsListeners.delete(listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', listener)
    }
  }
}

function getOpenGroupsSnapshot(): string {
  if (typeof window === 'undefined') return '{}'
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? '{}'
  } catch {
    return '{}'
  }
}

function saveOpenGroups(state: Record<string, boolean>): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    openGroupsListeners.forEach((listener) => listener())
  } catch {
    // ignore
  }
}

/**
 * Determine which group should be open by default based on the current path.
 * Multiple groups can match (e.g. /admin/staff and /admin/staff-dashboard);
 * we prefer the longest href match so the more specific one wins.
 */
function deriveAutoOpenGroups(pathname: string | null): Set<string> {
  const open = new Set<string>()
  if (!pathname) return open

  for (const group of NAV_GROUPS) {
    for (const child of group.children) {
      // Ignore query strings in comparison
      const childPath = child.href.split('?')[0]
      if (
        pathname === childPath ||
        pathname.startsWith(`${childPath}/`)
      ) {
        open.add(group.id)
        break
      }
    }
  }

  return open
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AdminSidebar() {
  const pathname = usePathname()

  // Subscribe to persisted state without setting React state in an effect.
  const openGroupsSnapshot = useSyncExternalStore(
    subscribeOpenGroups,
    getOpenGroupsSnapshot,
    () => '{}'
  )
  const openGroups = useMemo(() => {
    try {
      return JSON.parse(openGroupsSnapshot) as Record<string, boolean>
    } catch {
      return {}
    }
  }, [openGroupsSnapshot])

  // On mount: load persisted state, then ensure any group containing
  // the active route is open. We do this in a single effect to avoid
  // an extra render cycle.
  useEffect(() => {
    const persisted = loadOpenGroups()
    const auto = deriveAutoOpenGroups(pathname)

    const merged: Record<string, boolean> = { ...persisted }
    for (const groupId of auto) {
      merged[groupId] = true
    }

    saveOpenGroups(merged)
  }, [pathname])

  const toggleGroup = useCallback(
    (groupId: string) => {
      saveOpenGroups({ ...openGroups, [groupId]: !openGroups[groupId] })
    },
    [openGroups]
  )

  // Which groups contain the active route? Used for the collapsed-state
  // indicator dot on the group header.
  const activeGroups = useMemo(
    () => deriveAutoOpenGroups(pathname),
    [pathname]
  )

  return (
    <aside className="fixed left-0 top-0 h-full w-16 md:w-56 bg-rosewood text-plaster z-50 flex flex-col">
      {/* Brand */}
      <div className="p-4 border-b border-plaster/10 shrink-0">
        <h1 className="font-host-grotesk-narrow font-bold text-sm md:text-lg hidden md:block">
          Bazaar47 Admin
        </h1>
        <span className="font-host-grotesk-narrow font-bold text-sm md:hidden">
          B47
        </span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 p-2 md:p-4 space-y-1 md:space-y-2 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.id] === true
          const hasActiveChild = activeGroups.has(group.id)
          const GroupIcon = group.icon

          return (
            <div key={group.id}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-plaster/70 hover:bg-plaster/10 hover:text-plaster transition-all"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GroupIcon className="w-5 h-5 shrink-0" />
                  <span className="hidden md:block truncate font-semibold">
                    {group.label}
                  </span>
                  {/* Collapsed-on-mobile: show a dot if any child is active */}
                  {hasActiveChild && (
                    <span
                      className="md:hidden w-1.5 h-1.5 rounded-full bg-chartreuse shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="hidden md:block shrink-0 text-plaster/40">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
              </button>

              {/* Group children */}
              {isOpen && (
                <div className="md:pl-4 mt-1 space-y-0.5">
                  {group.children.map((child) => {
                    const childPath = child.href.split('?')[0]
                    const isActive =
                      pathname === childPath ||
                      pathname.startsWith(`${childPath}/`)

                    const ChildIcon = child.icon

                    if (child.comingSoon) {
                      return (
                        <div
                          key={child.href}
                          title="Coming in Phase 2"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm text-plaster/30 cursor-not-allowed select-none"
                        >
                          <ChildIcon className="w-4 h-4 shrink-0" />
                          <span className="hidden md:block truncate">
                            {child.label}
                          </span>
                          <span className="hidden md:inline-block ml-auto text-[9px] uppercase tracking-wider text-plaster/20">
                            Soon
                          </span>
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm transition-all ${
                          isActive
                            ? 'bg-plaster/20 text-plaster'
                            : 'text-plaster/60 hover:bg-plaster/10 hover:text-plaster'
                        }`}
                      >
                        <ChildIcon className="w-4 h-4 shrink-0" />
                        <span className="hidden md:block truncate">
                          {child.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-plaster/10 shrink-0">
        <LogoutButton />
      </div>
    </aside>
  )
}