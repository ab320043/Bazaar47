// app/staff/(app)/events/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CalendarDays,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import type { ShiftOffer } from '@/types/shift-offer'
import type { ShiftClaim } from '@/types/staff-claim'
import { EventCard } from './EventCard'
import { CalendarView } from './CalendarView'
import { ClaimModal } from './ClaimModal'

// ============================================
// TYPES
// ============================================

interface OfferWithStatus {
  offer: ShiftOffer
  slotsRemaining: number
  alreadyClaimed: boolean
  existingClaim: ShiftClaim | null
}

interface EventGroup {
  eventId: string
  eventName: string
  eventDate: string
  offers: OfferWithStatus[]
}

type ViewMode = 'grid' | 'list' | 'calendar'

const VIEW_STORAGE_KEY = 'staff_events_view'

// ============================================
// HELPERS
// ============================================

function loadViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'grid'
  try {
    const stored = sessionStorage.getItem(VIEW_STORAGE_KEY)
    if (stored === 'grid' || stored === 'list' || stored === 'calendar') {
      return stored
    }
  } catch {
    // ignore
  }
  return 'grid'
}

function saveViewMode(mode: ViewMode): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, mode)
  } catch {
    // ignore
  }
}

// ============================================
// MAIN PAGE
// ============================================

export default function StaffEventsPage() {
  const [groups, setGroups] = useState<EventGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>(loadViewMode)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  const fetchOffers = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null)
    try {
      const res = await fetch('/api/staff/offers')
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/staff/login'
          return
        }
        if (!opts?.silent) setError('Failed to load events')
        return
      }
      const body = await res.json()
      setGroups(body.groups || [])
    } catch (err) {
      console.error('Offers fetch error:', err)
      if (!opts?.silent) setError('Network error — please try again')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchOffers()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchOffers])

  const handleViewChange = (mode: ViewMode) => {
    setView(mode)
    saveViewMode(mode)
  }

  const activeEvent = useMemo(() => {
    if (!activeEventId) return null
    return groups.find((g) => g.eventId === activeEventId) || null
  }, [activeEventId, groups])

  // ---- LOADING ----

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-rosewood/60 font-host-grotesk">Loading events...</div>
      </div>
    )
  }

  // ---- ERROR ----

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-poppy/40 mb-3" />
        <div className="text-rosewood/60 font-host-grotesk text-center">
          {error}
        </div>
        <button
          onClick={() => fetchOffers()}
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-plaster pb-20">
      <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-host-grotesk font-bold text-2xl sm:text-3xl text-rosewood">
              Events
            </h1>
            <p className="font-host-grotesk text-rosewood/50 text-sm mt-0.5">
              {groups.length === 0
                ? 'No open shifts right now'
                : `${groups.length} event${groups.length === 1 ? '' : 's'} with open shifts`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOffers()}
              className="bg-white hover:bg-white/80 text-rosewood/60 px-3 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* View toggle */}
        {groups.length > 0 && (
          <div className="flex bg-white rounded-xl p-1 border border-rosewood/10 shadow-sm mb-6 w-fit">
            <button
              onClick={() => handleViewChange('grid')}
              className={`px-3 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-all flex items-center gap-1.5 ${
                view === 'grid'
                  ? 'bg-rosewood text-plaster'
                  : 'text-rosewood/60 hover:text-rosewood'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
            <button
              onClick={() => handleViewChange('list')}
              className={`px-3 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-all flex items-center gap-1.5 ${
                view === 'list'
                  ? 'bg-rosewood text-plaster'
                  : 'text-rosewood/60 hover:text-rosewood'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => handleViewChange('calendar')}
              className={`px-3 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-all flex items-center gap-1.5 ${
                view === 'calendar'
                  ? 'bg-rosewood text-plaster'
                  : 'text-rosewood/60 hover:text-rosewood'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>
        )}

        {/* Empty state */}
        {groups.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
            <CalendarDays className="w-16 h-16 text-rosewood/20 mx-auto mb-4" />
            <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">
              No open shifts
            </h3>
            <p className="font-host-grotesk text-rosewood/50 mt-2 max-w-md mx-auto">
              When Bazaar47 publishes new shifts, they&apos;ll show up here. Check
              back soon.
            </p>
          </div>
        )}

        {/* Grid view */}
        {view === 'grid' && groups.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <EventCard
                key={group.eventId}
                group={group}
                onClick={() => setActiveEventId(group.eventId)}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {view === 'list' && groups.length > 0 && (
          <div className="space-y-2">
            {groups.map((group) => (
              <EventCard
                key={group.eventId}
                group={group}
                variant="list"
                onClick={() => setActiveEventId(group.eventId)}
              />
            ))}
          </div>
        )}

        {/* Calendar view */}
        {view === 'calendar' && groups.length > 0 && (
          <CalendarView
            groups={groups}
            onSelectEvent={(eventId) => setActiveEventId(eventId)}
          />
        )}
      </div>

      {/* Claim modal */}
      {activeEvent && (
        <ClaimModal
          group={activeEvent}
          onClose={() => setActiveEventId(null)}
          onChanged={() => {
            void fetchOffers({ silent: true })
          }}
        />
      )}
    </div>
  )
}