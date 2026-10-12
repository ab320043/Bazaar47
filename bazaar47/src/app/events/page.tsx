// app/events/page.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ExternalLink,
  ArrowRight,
  Mic2,
  Sparkles,
  Users,
  Filter,
} from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'
import type { CalendarEvent, CalendarEventCategory } from '@/types/calendar'
import {
  getAllCalendarEvents,
  groupEventsByDate,
  filterEventsByCategory,
} from '@/lib/calendar/merge'
import { toIsoLocal } from '@/lib/open-mic/sessions'

// ============================================
// CONSTANTS
// ============================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Navigation range — earliest and latest month the user can browse.
 * Anything outside this range disables the corresponding chevron.
 */
const EARLIEST_YEAR = 2026
const EARLIEST_MONTH = 8 // August
const LATEST_YEAR = 2027
const LATEST_MONTH = 12 // December

// ============================================
// CATEGORY FILTERS
// ============================================

type FilterKey = 'all' | CalendarEventCategory

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'tour', label: 'Tour' },
  { key: 'workshop', label: 'Workshops' },
  { key: 'community', label: 'Community' },
  { key: 'open-mic', label: 'Open Mic' },
  { key: 'external', label: 'At Bazaar47' },
]

// ============================================
// HELPERS
// ============================================

function isBeforeOrEqual(
  yearA: number,
  monthA: number,
  yearB: number,
  monthB: number
): boolean {
  if (yearA < yearB) return true
  if (yearA > yearB) return false
  return monthA <= monthB
}

function buildMonthGrid(
  year: number,
  month: number
): { iso: string | null; dayOfMonth: number | null; isToday: boolean }[] {
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leadingBlanks = first.getDay()
  const cells: {
    iso: string | null
    dayOfMonth: number | null
    isToday: boolean
  }[] = []

  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ iso: null, dayOfMonth: null, isToday: false })
  }

  const todayIso = toIsoLocal(new Date())

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day)
    const iso = toIsoLocal(d)
    cells.push({
      iso,
      dayOfMonth: day,
      isToday: iso === todayIso,
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ iso: null, dayOfMonth: null, isToday: false })
  }

  return cells
}

function formatEventDateLong(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDayOfWeek(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function getMonthDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ============================================
// MAIN PAGE
// ============================================

export default function EventsPage() {
  const allEvents = useMemo(() => getAllCalendarEvents(), [])
  const [filter, setFilter] = useState<FilterKey>('all')

  const filteredEvents = useMemo(
    () => filterEventsByCategory(allEvents, filter),
    [allEvents, filter]
  )

  const eventsByDate = useMemo(
    () => groupEventsByDate(filteredEvents),
    [filteredEvents]
  )

  // ---- Calendar month navigation ----
  const today = new Date()
  const [activeYear, setActiveYear] = useState(today.getFullYear())
  const [activeMonth, setActiveMonth] = useState(today.getMonth() + 1)
  const [direction, setDirection] = useState<1 | -1>(1)

  // Reset the month when a filter change leaves the active month empty.
  const handleFilterChange = (nextFilter: FilterKey) => {
    if (nextFilter === filter) return

    const nextFilteredEvents = filterEventsByCategory(allEvents, nextFilter)
    const monthHasEvents = nextFilteredEvents.some((e) => {
      const d = new Date(`${e.date}T12:00:00`)
      return (
        d.getFullYear() === activeYear && d.getMonth() + 1 === activeMonth
      )
    })
    if (!monthHasEvents && nextFilteredEvents.length > 0) {
      // Jump to the month of the first upcoming event
      const firstEvent = nextFilteredEvents[0]
      const d = new Date(`${firstEvent.date}T12:00:00`)
      setActiveYear(d.getFullYear())
      setActiveMonth(d.getMonth() + 1)
    }
    setFilter(nextFilter)
  }

  const grid = useMemo(
    () => buildMonthGrid(activeYear, activeMonth),
    [activeYear, activeMonth]
  )

  // Navigation bounds
  const canGoPrev = !isBeforeOrEqual(
    activeYear,
    activeMonth,
    EARLIEST_YEAR,
    EARLIEST_MONTH
  )
  const canGoNext = !isBeforeOrEqual(
    LATEST_YEAR,
    LATEST_MONTH,
    activeYear,
    activeMonth
  )

  const goPrev = () => {
    if (!canGoPrev) return
    setDirection(-1)
    if (activeMonth === 1) {
      setActiveYear(activeYear - 1)
      setActiveMonth(12)
    } else {
      setActiveMonth(activeMonth - 1)
    }
  }

  const goNext = () => {
    if (!canGoNext) return
    setDirection(1)
    if (activeMonth === 12) {
      setActiveYear(activeYear + 1)
      setActiveMonth(1)
    } else {
      setActiveMonth(activeMonth + 1)
    }
  }

  // Events in the active month, grouped for the list
  const monthEvents = useMemo(() => {
    return filteredEvents.filter((e) => {
      const d = new Date(`${e.date}T12:00:00`)
      return (
        d.getFullYear() === activeYear && d.getMonth() + 1 === activeMonth
      )
    })
  }, [filteredEvents, activeYear, activeMonth])

  // Group month events by day for the list below
  const monthEventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of monthEvents) {
      if (!map.has(e.date)) map.set(e.date, [])
      map.get(e.date)!.push(e)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [monthEvents])

  return (
    <div className="relative min-h-screen bg-plaster">
      {/* Overlay texture */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <Image src={overlay} alt="" fill className="object-cover" priority />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-20 max-w-5xl">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-rosewood/30" />
            <span className="font-host-grotesk text-[10px] sm:text-xs text-rosewood/50 uppercase tracking-[0.3em] font-bold">
              Bazaar47
            </span>
            <span className="w-8 h-px bg-rosewood/30" />
          </div>
          <h1 className="font-host-grotesk font-bold text-4xl sm:text-5xl md:text-6xl text-rosewood leading-tight">
            Events at Bazaar47
          </h1>
          <p className="font-host-grotesk text-sm sm:text-base text-rosewood/60 mt-3 max-w-xl mx-auto">
            Everything happening at 60 SW 2nd Street.
          </p>
        </motion.header>

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-8"
        >
          <Filter className="w-4 h-4 text-rosewood/40 hidden sm:block" />
          {FILTERS.map((f) => {
            const isActive = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                className={`px-4 py-2 rounded-full font-host-grotesk font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-rosewood text-plaster shadow-sm'
                    : 'bg-white/70 text-rosewood/60 hover:bg-white hover:text-rosewood'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </motion.div>

        {/* Calendar card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white rounded-3xl border border-rosewood/5 shadow-sm overflow-hidden mb-10"
        >
          {/* Month navigator */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-rosewood/10">
            <button
              onClick={goPrev}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className="p-2 rounded-full bg-plaster hover:bg-sand-dune/60 text-rosewood transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={`${activeYear}-${activeMonth}`}
                initial={{ opacity: 0, x: direction * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -20 }}
                transition={{ duration: 0.25 }}
                className="font-host-grotesk font-bold text-lg sm:text-xl text-rosewood"
              >
                {MONTH_NAMES[activeMonth - 1]} {activeYear}
              </motion.h2>
            </AnimatePresence>

            <button
              onClick={goNext}
              disabled={!canGoNext}
              aria-label="Next month"
              className="p-2 rounded-full bg-plaster hover:bg-sand-dune/60 text-rosewood transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-2 sm:px-4 pt-3">
            {WEEKDAY_HEADERS.map((day) => (
              <div
                key={day}
                className="text-center font-host-grotesk font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-rosewood/40 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="px-2 sm:px-4 pb-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${activeYear}-${activeMonth}`}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="grid grid-cols-7 gap-1 sm:gap-1.5"
              >
                {grid.map((cell, i) => (
                  <DayCell
                    key={cell.iso ?? `pad-${i}`}
                    cell={cell}
                    events={
                      cell.iso ? eventsByDate.get(cell.iso) || [] : []
                    }
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="px-4 sm:px-6 py-3 border-t border-rosewood/10 bg-plaster/30 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-chartreuse" />
              <span className="font-host-grotesk text-[11px] text-rosewood/60">
                Bazaar47 event
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rosewood" />
              <span className="font-host-grotesk text-[11px] text-rosewood/60">
                At Bazaar47
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border-2 border-chartreuse" />
              <span className="font-host-grotesk text-[11px] text-rosewood/60">
                Recurring
              </span>
            </div>
          </div>
        </motion.div>

        {/* Events list for the active month */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-host-grotesk font-bold text-2xl text-rosewood">
            {monthEvents.length > 0
              ? `${MONTH_NAMES[activeMonth - 1]} events`
              : 'No events this month'}
          </h2>
          {monthEvents.length > 0 && (
            <span className="font-host-grotesk text-sm text-rosewood/50">
              {monthEvents.length}{' '}
              {monthEvents.length === 1 ? 'event' : 'events'}
            </span>
          )}
        </div>

        {monthEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
            <CalendarIcon className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
            <p className="font-host-grotesk text-rosewood/50">
              Nothing scheduled for {MONTH_NAMES[activeMonth - 1]}{' '}
              {activeYear}.
            </p>
            <p className="font-host-grotesk text-sm text-rosewood/30 mt-1">
              Try navigating to a different month above.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {monthEventsByDay.map(([dateIso, events]) => (
              <div key={dateIso}>
                {/* Date heading */}
                <div className="flex items-baseline gap-3 mb-3">
                  <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                    {formatEventDateLong(dateIso)}
                  </h3>
                  <span className="font-host-grotesk text-xs text-rosewood/40">
                    {events.length}{' '}
                    {events.length === 1 ? 'event' : 'events'}
                  </span>
                </div>

                {/* Events on this day */}
                <div className="space-y-2">
                  {events.map((event) => (
                    <EventListItem key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center font-host-grotesk text-xs text-rosewood/30 mt-12">
          Bazaar47 · 60 SW 2nd Street, Gainesville, FL
        </p>
      </div>
    </div>
  )
}

// ============================================
// DAY CELL
// ============================================

interface DayCellProps {
  cell: { iso: string | null; dayOfMonth: number | null; isToday: boolean }
  events: CalendarEvent[]
}

function DayCell({ cell, events }: DayCellProps) {
  if (cell.iso === null || cell.dayOfMonth === null) {
    return <div className="aspect-square" aria-hidden="true" />
  }

  const hasEvents = events.length > 0
  const hasRecurring = events.some((e) => e.isRecurring)
  const hasNative = events.some(
    (e) => e.source === 'native' || e.source === 'workshop'
  )
  const hasExternal = events.some((e) => e.source === 'external')
  const { isToday, dayOfMonth } = cell

  return (
    <div
      className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm sm:text-base font-host-grotesk transition-colors ${
        isToday
          ? 'ring-2 ring-poppy/50 bg-white'
          : hasEvents
          ? 'bg-plaster/60 hover:bg-plaster'
          : 'text-rosewood/25'
      } ${hasEvents ? 'font-semibold text-rosewood' : ''}`}
    >
      <span className="leading-none">{dayOfMonth}</span>

      {/* Dot indicators */}
      {hasEvents && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
          {hasRecurring && (
            <span className="w-1.5 h-1.5 rounded-full border-2 border-chartreuse" />
          )}
          {hasNative && !hasRecurring && (
            <span className="w-1.5 h-1.5 rounded-full bg-chartreuse" />
          )}
          {hasExternal && (
            <span className="w-1.5 h-1.5 rounded-full bg-rosewood" />
          )}
        </div>
      )}

      {/* Today dot */}
      {isToday && !hasEvents && (
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-poppy" />
      )}
    </div>
  )
}

// ============================================
// EVENT LIST ITEM
// ============================================

function EventListItem({ event }: { event: CalendarEvent }) {
  const isExternal = event.source === 'external'
  const isRecurring = event.isRecurring

  const categoryLabel = (() => {
    if (event.category === 'tour') return 'Tour'
    if (event.category === 'workshop') return 'Workshop'
    if (event.category === 'open-mic') return 'Open Mic'
    if (event.category === 'external') return 'At Bazaar47'
    return 'Community'
  })()

  const categoryStyle = (() => {
    if (event.category === 'tour')
      return 'bg-rosewood/10 text-rosewood'
    if (event.category === 'workshop')
      return 'bg-chartreuse/20 text-cypress'
    if (event.category === 'open-mic')
      return 'bg-chartreuse/15 text-cypress'
    if (event.category === 'external')
      return 'bg-rosewood/10 text-rosewood/70'
    return 'bg-plaster text-rosewood/70'
  })()

  const className = `block group bg-white rounded-xl border border-rosewood/5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${
    isRecurring ? 'border-l-4 border-l-chartreuse' : ''
  }`

  const content = (
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryStyle}`}
            >
              {categoryLabel}
            </span>
            {isRecurring && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-chartreuse/50 text-cypress flex items-center gap-1">
                <Mic2 className="w-3 h-3" />
                Weekly
              </span>
            )}
          </div>

          <h4 className="font-host-grotesk font-bold text-rosewood leading-snug">
            {event.title}
          </h4>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-rosewood/50">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.timeStart}
              {event.timeEnd ? ` – ${event.timeEnd}` : ''}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.venue}
              </span>
            )}
          </div>

          {event.description && (
            <p className="font-host-grotesk text-sm text-rosewood/60 mt-2 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        <div className="shrink-0 pt-1">
          {isExternal ? (
            <ExternalLink className="w-4 h-4 text-rosewood/40 group-hover:text-rosewood transition-colors" />
          ) : (
            <ArrowRight className="w-4 h-4 text-rosewood/40 group-hover:text-chartreuse group-hover:translate-x-0.5 transition-all" />
          )}
        </div>
      </div>
  )

  if (event.internalUrl) {
    return (
      <Link href={event.internalUrl} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <a
      href={event.externalUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {content}
    </a>
  )
}