'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, MapPin, Users, Ticket, 
  Building2, ArrowRight, CheckCircle, Clock
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
      case 'active': return 'bg-chartreuse'
      case 'completed': return 'bg-rosewood/40'
      case 'upcoming': return 'bg-hippie'
      case 'past': return 'bg-rosewood/30'
      default: return 'bg-rosewood/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <div className="w-2 h-2 rounded-full bg-chartreuse animate-pulse" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-rosewood/40" />
      case 'upcoming': return <Clock className="w-4 h-4 text-hippie" />
      default: return <div className="w-2 h-2 rounded-full bg-rosewood/30" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading events...</div>
      </div>
    )
  }

  // Group events by type
  const tourEvents = events.filter(e => e.type === 'tour')
  const standaloneEvents = events.filter(e => e.type !== 'tour')

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
              {events.length} events • {events.reduce((acc, e) => acc + e.stats.total, 0)} total submissions
            </p>
          </div>
          <div className="flex gap-2">
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
                <EventCard key={event.id} event={event} />
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
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Event Card Component
function EventCard({ event }: { event: EventWithStats }) {
  const statusColor = event.status === 'active' ? 'border-chartreuse/30' : 'border-rosewood/10'
  
  return (
    <Link href={`/admin/events/${event.id}`}>
      <div className={`bg-white rounded-2xl p-5 border-2 ${statusColor} shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-host-grotesk font-bold text-lg text-rosewood">{event.name}</h3>
              {event.status === 'completed' && (
                <span className="text-xs bg-rosewood/10 text-rosewood/50 px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-rosewood/40 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{event.dateDisplay || event.date}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {event.status === 'active' && (
              <span className="text-xs font-host-grotesk font-semibold text-chartreuse bg-chartreuse/10 px-2 py-0.5 rounded-full">
                Live
              </span>
            )}
            <div className={`w-2.5 h-2.5 rounded-full ${event.status === 'active' ? 'bg-chartreuse animate-pulse' : 'bg-rosewood/30'}`} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-rosewood/50 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{event.location}</span>
        </div>

        {/* Stats */}
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
            {event.capacity ? `${event.stats.tickets}/${event.capacity} tickets` : `${event.stats.tickets} tickets`}
          </span>
          <span className="text-chartreuse font-host-grotesk text-sm font-semibold flex items-center gap-1">
            View Details <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}