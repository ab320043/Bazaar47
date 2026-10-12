// app/admin/dashboard/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Search,
  X,
  Zap,
  Clock,
  Archive,
  FolderArchive,
  Circle,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface EventWithStats {
  id: string
  slug: string
  name: string
  type: string
  status: string
  date: string
  dateDisplay: string
  time: string
  location: string
  city?: string
  capacity?: number
  hasVendors: boolean
  hasRSVP: boolean
  hasDanceSignup: boolean
  stats: {
    total: number
    vendors: number
    rsvps: number
    danceSignups: number
    tickets: number
  }
}

// ============================================
// HELPERS
// ============================================

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function classifyEvent(event: EventWithStats): 'live' | 'upcoming' | 'past' | 'archived' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventDate = new Date(event.date)
  eventDate.setHours(0, 0, 0, 0)

  // Archived: explicitly completed/past, or before today by more than 0 days
  if (event.status === 'completed' || event.status === 'past') {
    return 'archived'
  }

  // Live: happening today
  if (isSameDay(eventDate, today)) {
    return 'live'
  }

  // Past: event date < today but status isn't completed yet
  if (eventDate < today) {
    return 'past'
  }

  // Upcoming: event date > today
  return 'upcoming'
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminDashboard() {
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState<string>('all')

  useEffect(() => {
    let cancelled = false

    const loadEvents = async () => {
      try {
        // Fetch everything including archived so we can group locally
        const response = await fetch(
          '/api/admin/events?filter=all&includeArchived=true'
        )
        const data = await response.json()

        if (!cancelled) {
          setEvents(data.events || [])
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
        if (!cancelled) setLoading(false)
      }
    }

    loadEvents()

    return () => {
      cancelled = true
    }
  }, [])

  // ---- Filtering ----

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchName = event.name.toLowerCase().includes(search)
        const matchCity = event.city?.toLowerCase().includes(search) || false
        const matchLocation = event.location.toLowerCase().includes(search)
        if (!matchName && !matchCity && !matchLocation) return false
      }

      if (selectedCity !== 'all' && event.type === 'tour') {
        if (event.city !== selectedCity) return false
      }

      return true
    })
  }, [events, searchTerm, selectedCity])

  // ---- Grouping by status ----

  const groups = useMemo(() => {
    const live: EventWithStats[] = []
    const upcoming: EventWithStats[] = []
    const past: EventWithStats[] = []
    const archived: EventWithStats[] = []

    for (const event of filteredEvents) {
      const bucket = classifyEvent(event)
      if (bucket === 'live') live.push(event)
      else if (bucket === 'upcoming') upcoming.push(event)
      else if (bucket === 'past') past.push(event)
      else archived.push(event)
    }

    // Sort: Live asc, Upcoming asc, Past desc, Archived desc
    live.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    upcoming.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    archived.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return { live, upcoming, past, archived }
  }, [filteredEvents])

  // Unique cities from tour events (for the filter dropdown)
  const tourCities = useMemo(
    () =>
      Array.from(
        new Set(
          events
            .filter((e) => e.type === 'tour')
            .map((e) => e.city)
            .filter(Boolean) as string[]
        )
      ),
    [events]
  )

  const totalCount =
    groups.live.length +
    groups.upcoming.length +
    groups.past.length +
    groups.archived.length

  const hasAnyEvents = totalCount > 0

  // ---- Loading ----

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood">
              Dashboard
            </h1>
            <p className="font-host-grotesk text-rosewood/50">
              {totalCount} events •{' '}
              {filteredEvents.reduce((acc, e) => acc + e.stats.total, 0)} total
              submissions
            </p>
          </div>
        </div>

        {/* Search & City filter */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rosewood/30" />
              <input
                type="text"
                placeholder="Search events by name, city, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-rosewood/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-sm text-rosewood"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-rosewood/40 hover:text-rosewood transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {tourCities.length > 0 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2.5 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
            >
              <option value="all">All Cities</option>
              {tourCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* No events at all */}
        {!hasAnyEvents && (
          <div className="text-center py-16">
            <div className="bg-white/50 rounded-2xl p-12 border border-rosewood/5">
              <Calendar className="w-16 h-16 text-rosewood/20 mx-auto mb-4" />
              <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">
                No events found
              </h3>
              <p className="font-host-grotesk text-rosewood/40 mt-2">
                {searchTerm || selectedCity !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Events will appear here as they are added'}
              </p>
            </div>
          </div>
        )}

        {/* Sections */}
        {hasAnyEvents && (
          <div className="space-y-10">
            {/* LIVE NOW */}
            {groups.live.length > 0 && (
              <Section
                icon={<Zap className="w-5 h-5" />}
                title="Live Now"
                subtitle={`${groups.live.length} happening today`}
                accent="chartreuse"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.live.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </Section>
            )}

            {/* UPCOMING */}
            {groups.upcoming.length > 0 && (
              <Section
                icon={<Clock className="w-5 h-5" />}
                title="Upcoming"
                subtitle={`${groups.upcoming.length} scheduled`}
                accent="rosewood"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.upcoming.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </Section>
            )}

            {/* PAST */}
            {groups.past.length > 0 && (
              <Section
                icon={<Circle className="w-5 h-5" />}
                title="Past"
                subtitle={`${groups.past.length} recently ended`}
                accent="grove"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.past.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </Section>
            )}

            {/* ARCHIVED */}
            {groups.archived.length > 0 && (
              <Section
                icon={<FolderArchive className="w-5 h-5" />}
                title="Archived"
                subtitle={`${groups.archived.length} completed`}
                accent="muted"
                action={
                  <Link
                    href="/admin/archive"
                    className="inline-flex items-center gap-1 text-sm font-host-grotesk font-semibold text-rosewood/60 hover:text-rosewood transition-colors"
                  >
                    View all in Archive
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.archived.slice(0, 6).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
                {groups.archived.length > 6 && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/admin/archive"
                      className="inline-flex items-center gap-2 text-sm font-host-grotesk font-semibold text-rosewood/60 hover:text-rosewood transition-colors"
                    >
                      +{groups.archived.length - 6} more archived events
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// SECTION WRAPPER
// ============================================

function Section({
  icon,
  title,
  subtitle,
  accent,
  action,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  accent: 'chartreuse' | 'rosewood' | 'grove' | 'muted'
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const iconWrap = (() => {
    if (accent === 'chartreuse') return 'bg-chartreuse/15 text-cypress'
    if (accent === 'rosewood') return 'bg-rosewood/10 text-rosewood'
    if (accent === 'grove') return 'bg-grove/10 text-grove'
    return 'bg-rosewood/5 text-rosewood/50'
  })()

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconWrap}`}
          >
            {icon}
          </div>
          <div>
            <h2 className="font-host-grotesk font-bold text-2xl text-rosewood leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="font-host-grotesk text-sm text-rosewood/50">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}

// ============================================
// EVENT CARD
// ============================================

function EventCard({ event }: { event: EventWithStats }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-chartreuse text-grove'
      case 'completed':
        return 'bg-rosewood/20 text-rosewood/60'
      case 'upcoming':
        return 'bg-pomegranate text-plaster'
      case 'past':
        return 'bg-grove/20 text-grove'
      default:
        return 'bg-rosewood/10 text-rosewood'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢 Live Now'
      case 'completed':
        return '✅ Completed'
      case 'upcoming':
        return '🔜 Upcoming'
      case 'past':
        return '📅 Past'
      default:
        return status
    }
  }

  const statusColor = getStatusBadge(event.status)
  const cardBorder =
    event.status === 'active'
      ? 'border-chartreuse/30'
      : event.status === 'upcoming'
      ? 'border-pomegranate/30'
      : event.status === 'completed'
      ? 'border-rosewood/20'
      : 'border-rosewood/10'

  return (
    <Link href={`/admin/events/${event.id}`}>
      <div
        className={`bg-white rounded-2xl p-5 border-2 ${cardBorder} shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                {event.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-rosewood/40 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{event.dateDisplay || event.date}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-host-grotesk font-semibold px-2 py-0.5 rounded-full ${statusColor}`}
            >
              {getStatusLabel(event.status)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-rosewood/50 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{event.location}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-rosewood/5">
          <div className="text-center">
            <p className="font-host-grotesk text-xs text-rosewood/40">Total</p>
            <p className="font-host-grotesk font-bold text-rosewood">
              {event.stats.total}
            </p>
          </div>
          {event.hasVendors && (
            <div className="text-center">
              <p className="font-host-grotesk text-xs text-rosewood/40">
                Vendors
              </p>
              <p className="font-host-grotesk font-bold text-rosewood">
                {event.stats.vendors}
              </p>
            </div>
          )}
          {event.hasRSVP && (
            <div className="text-center">
              <p className="font-host-grotesk text-xs text-rosewood/40">
                RSVPs
              </p>
              <p className="font-host-grotesk font-bold text-rosewood">
                {event.stats.rsvps}
              </p>
            </div>
          )}
          {event.hasDanceSignup && (
            <div className="text-center">
              <p className="font-host-grotesk text-xs text-rosewood/40">
                Dancers
              </p>
              <p className="font-host-grotesk font-bold text-rosewood">
                {event.stats.danceSignups}
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-rosewood/5 flex items-center justify-between">
          <span className="font-host-grotesk text-xs text-rosewood/40">
            {event.stats.tickets} tickets sold
          </span>
          <span className="text-chartreuse font-host-grotesk text-sm font-semibold flex items-center gap-1">
            View Details <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}