'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, MapPin, Users, Ticket, 
  Building2, ArrowRight, CheckCircle, Clock,
  Search, Filter, X
} from 'lucide-react'

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

export default function AdminDashboard() {
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState<string>('all')

  useEffect(() => {
    let cancelled = false

    const loadEvents = async () => {
      try {
        const response = await fetch(`/api/admin/events?filter=${filter}`)
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

    void loadEvents()

    return () => {
      cancelled = true
    }
  }, [filter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-chartreuse/50 bg-chartreuse/5'
      case 'completed': return 'border-rosewood/30 bg-rosewood/5'
      case 'upcoming': return 'border-pomegranate/50 bg-pomegranate/5'
      case 'past': return 'border-grove/30 bg-grove/5'
      default: return 'border-rosewood/10'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-chartreuse text-grove'
      case 'completed': return 'bg-rosewood/20 text-rosewood/60'
      case 'upcoming': return 'bg-pomegranate text-plaster'
      case 'past': return 'bg-grove/20 text-grove'
      default: return 'bg-rosewood/10 text-rosewood'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '🟢 Live Now'
      case 'completed': return '✅ Completed'
      case 'upcoming': return '🔜 Upcoming'
      case 'past': return '📅 Past'
      default: return status
    }
  }

  // Get unique cities from tour events
  const tourCities = Array.from(
    new Set(events.filter(e => e.type === 'tour').map(e => e.city).filter(Boolean))
  )

  // Filter events
  const filteredEvents = events.filter(event => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchName = event.name.toLowerCase().includes(search)
      const matchCity = event.city?.toLowerCase().includes(search) || false
      const matchLocation = event.location.toLowerCase().includes(search)
      if (!matchName && !matchCity && !matchLocation) return false
    }

    // City filter (only for tour events)
    if (selectedCity !== 'all' && event.type === 'tour') {
      if (event.city !== selectedCity) return false
    }

    return true
  })

  // Group events by type
  const tourEvents = filteredEvents.filter(e => e.type === 'tour')
  const standaloneEvents = filteredEvents.filter(e => e.type !== 'tour')

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
              {filteredEvents.length} events • {filteredEvents.reduce((acc, e) => acc + e.stats.total, 0)} total submissions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'upcoming', 'past'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all ${
                  filter === f 
                    ? 'bg-rosewood text-plaster' 
                    : 'bg-white text-rosewood/60 hover:bg-white/80'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
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
            </div>
          </div>

          {/* City Filter - Only for tour events */}
          {tourCities.length > 0 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2.5 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
            >
              <option value="all">All Cities</option>
              {tourCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          )}

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-rosewood/40 hover:text-rosewood transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tour Events Section */}
        {tourEvents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-host-grotesk font-bold text-2xl text-rosewood">Florida Tour</h2>
              <span className="text-sm font-host-grotesk text-rosewood/40">
                {tourEvents.filter(e => e.status === 'active').length} active
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tourEvents.map((event) => (
                <EventCard key={event.id} event={event} getStatusBadge={getStatusBadge} getStatusLabel={getStatusLabel} />
              ))}
            </div>
          </div>
        )}

        {/* Standalone Events Section */}
        {standaloneEvents.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-host-grotesk font-bold text-2xl text-rosewood">Special Events</h2>
              <span className="text-sm font-host-grotesk text-rosewood/40">
                {standaloneEvents.length} events
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {standaloneEvents.map((event) => (
                <EventCard key={event.id} event={event} getStatusBadge={getStatusBadge} getStatusLabel={getStatusLabel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Event Card Component
function EventCard({ event, getStatusBadge, getStatusLabel }: { 
  event: EventWithStats
  getStatusBadge: (status: string) => string
  getStatusLabel: (status: string) => string
}) {
  const statusColor = getStatusBadge(event.status)
  const cardBorder = event.status === 'active' ? 'border-chartreuse/30' : 
                     event.status === 'upcoming' ? 'border-pomegranate/30' :
                     event.status === 'completed' ? 'border-rosewood/20' : 'border-rosewood/10'
  
  return (
    <Link href={`/admin/events/${event.id}`}>
      <div className={`bg-white rounded-2xl p-5 border-2 ${cardBorder} shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-host-grotesk font-bold text-lg text-rosewood">{event.name}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-rosewood/40 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{event.dateDisplay || event.date}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-host-grotesk font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
              {getStatusLabel(event.status)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-rosewood/50 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{event.location}</span>
        </div>

        {/* Stats - Removed capacity display */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-rosewood/5">
          <div className="text-center">
            <p className="font-host-grotesk text-xs text-rosewood/40">Total</p>
            <p className="font-host-grotesk font-bold text-rosewood">{event.stats.total}</p>
          </div>
          {event.hasVendors && (
            <div className="text-center">
              <p className="font-host-grotesk text-xs text-rosewood/40">Vendors</p>
              <p className="font-host-grotesk font-bold text-rosewood">{event.stats.vendors}</p>
            </div>
          )}
          {event.hasRSVP && (
            <div className="text-center">
              <p className="font-host-grotesk text-xs text-rosewood/40">RSVPs</p>
              <p className="font-host-grotesk font-bold text-rosewood">{event.stats.rsvps}</p>
            </div>
          )}
          {event.hasDanceSignup && (
            <div className="text-center">
              <p className="font-host-grotesk text-xs text-rosewood/40">Dancers</p>
              <p className="font-host-grotesk font-bold text-rosewood">{event.stats.danceSignups}</p>
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