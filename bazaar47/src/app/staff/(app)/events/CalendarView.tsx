// app/staff/(app)/events/CalendarView.tsx
'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import type { ShiftOffer } from '@/types/shift-offer'
import type { ShiftClaim } from '@/types/staff-claim'
import { STAFF_ROLES } from '@/data/staff-roles'

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

interface CalendarViewProps {
  groups: EventGroup[]
  onSelectEvent: (eventId: string) => void
}

// ============================================
// HELPERS
// ============================================

function toIsoLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leading = first.getDay()

  const cells: (string | null)[] = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toIsoLocal(new Date(year, month - 1, d)))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ============================================
// COMPONENT
// ============================================

export function CalendarView({ groups, onSelectEvent }: CalendarViewProps) {
  // Anchor on the earliest event's month, or today if no events.
  const today = new Date()
  const initial = groups[0]
    ? new Date(`${groups[0].eventDate}T12:00:00`)
    : today

  const [year, setYear] = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth() + 1)

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventGroup[]>()
    for (const g of groups) {
      if (!map.has(g.eventDate)) map.set(g.eventDate, [])
      map.get(g.eventDate)!.push(g)
    }
    return map
  }, [groups])

  const cells = useMemo(() => monthGrid(year, month), [year, month])
  const todayIso = toIsoLocal(today)

  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const first = groups[0]
    return first ? first.eventDate : null
  })

  const goPrev = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const goNext = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const dayEvents = selectedDate ? eventsByDate.get(selectedDate) || [] : []

  return (
    <div className="space-y-4">
      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-rosewood/10">
          <button
            onClick={goPrev}
            aria-label="Previous month"
            className="p-2 rounded-full bg-plaster hover:bg-sand-dune/60 text-rosewood transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-host-grotesk font-bold text-base sm:text-lg text-rosewood">
            {MONTHS[month - 1]} {year}
          </h3>
          <button
            onClick={goNext}
            aria-label="Next month"
            className="p-2 rounded-full bg-plaster hover:bg-sand-dune/60 text-rosewood transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 px-2 pt-3">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center font-host-grotesk font-semibold text-[10px] uppercase tracking-wider text-rosewood/40 py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 px-2 pb-3">
          {cells.map((iso, i) => {
            if (!iso) return <div key={`pad-${i}`} className="aspect-square" />

            const dayNum = parseInt(iso.slice(8), 10)
            const hasEvents = eventsByDate.has(iso)
            const isToday = iso === todayIso
            const isSelected = iso === selectedDate

            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-host-grotesk font-semibold transition-colors ${
                  isSelected
                    ? 'bg-chartreuse text-grove'
                    : hasEvents
                    ? 'bg-chartreuse/10 text-cypress hover:bg-chartreuse/20'
                    : 'text-rosewood/40 hover:bg-plaster'
                } ${isToday && !isSelected ? 'ring-2 ring-poppy/40' : ''}`}
              >
                {dayNum}
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-chartreuse" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Events for selected date */}
      {selectedDate && (
        <div>
          <h4 className="font-host-grotesk font-bold text-sm text-rosewood uppercase tracking-wider mb-2">
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h4>
          {dayEvents.length === 0 ? (
            <div className="bg-white rounded-xl p-6 border border-rosewood/5 text-center">
              <Calendar className="w-8 h-8 text-rosewood/20 mx-auto mb-2" />
              <p className="font-host-grotesk text-sm text-rosewood/40">
                No shifts this day
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayEvents.map((g) => (
                <button
                  key={g.eventId}
                  onClick={() => onSelectEvent(g.eventId)}
                  className="w-full text-left bg-white rounded-xl border border-rosewood/10 hover:border-chartreuse shadow-sm hover:shadow-md transition-all p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-host-grotesk font-bold text-rosewood truncate">
                        {g.eventName}
                      </p>
                      <p className="font-host-grotesk text-xs text-rosewood/50 mt-0.5">
                        {g.offers
                          .filter((o) => o.slotsRemaining > 0 || o.alreadyClaimed)
                          .map((o) => {
                            const label =
                              STAFF_ROLES.find((r) => r.id === o.offer.role)
                                ?.label || o.offer.role
                            return o.alreadyClaimed ? `${label} (pending)` : label
                          })
                          .join(' · ')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rosewood/40 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}