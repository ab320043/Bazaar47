// app/admin/archive/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, MapPin, Users, Ticket, 
  Archive as ArchiveIcon, ArrowRight, 
  Search, X, FolderArchive
} from 'lucide-react'

interface ArchivedEvent {
  id: string
  slug: string
  name: string
  type: string
  status: 'completed' | 'past'
  date: string
  dateDisplay: string
  time: string
  location: string
  city?: string
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

export default function ArchivePage() {
  const [events, setEvents] = useState<ArchivedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    const fetchArchivedEvents = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/events?filter=past&includeArchived=true')
        const data = await response.json()
        setEvents(data.events || [])
      } catch (error) {
        console.error('Failed to fetch archived events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArchivedEvents()
  }, [])

  const getStatusBadge = (status: string) => {
    return 'bg-rosewood/20 text-rosewood/60'
  }

  const getStatusLabel = (status: string) => {
    return '📦 Archived'
  }

  const filteredEvents = events.filter(event => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchName = event.name.toLowerCase().includes(search)
      const matchCity = event.city?.toLowerCase().includes(search) || false
      const matchLocation = event.location.toLowerCase().includes(search)
      if (!matchName && !matchCity && !matchLocation) return false
    }
    if (typeFilter !== 'all' && event.type !== typeFilter) return false
    return true
  })

  // Get unique types
  const types = ['all', ...new Set(events.map(e => e.type))]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading archived events...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <FolderArchive className="w-8 h-8 text-rosewood/60" />
              <div>
                <h1 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood">
                  Archive
                </h1>
                <p className="font-host-grotesk text-rosewood/50">
                  {filteredEvents.length} archived events • All past submissions preserved
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rosewood/30" />
              <input
                type="text"
                placeholder="Search archived events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-rosewood/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-sm text-rosewood"
              />
            </div>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
          >
            <option value="all">All Types</option>
            {types.filter(t => t !== 'all').map(type => (
              <option key={type} value={type}>{type.replace('-', ' ')}</option>
            ))}
          </select>

          {(searchTerm || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
              }}
              className="text-rosewood/40 hover:text-rosewood transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Archived Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <Link key={event.id} href={`/admin/events/${event.id}`}>
                <div className="bg-white rounded-2xl p-5 border-2 border-rosewood/10 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
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
                      <span className={`text-xs font-host-grotesk font-semibold px-2 py-0.5 rounded-full bg-rosewood/20 text-rosewood/60`}>
                        📦 Archived
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
                      <p className="font-host-grotesk font-bold text-rosewood">{event.stats.total}</p>
                    </div>
                    {event.type === 'workshop' ? (
                      <>
                        <div className="text-center">
                          <p className="font-host-grotesk text-xs text-rosewood/40">RSVPs</p>
                          <p className="font-host-grotesk font-bold text-rosewood">{event.stats.rsvps}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-host-grotesk text-xs text-rosewood/40">Tickets</p>
                          <p className="font-host-grotesk font-bold text-rosewood">{event.stats.tickets}</p>
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-rosewood/5 flex items-center justify-between">
                    <span className="font-host-grotesk text-xs text-rosewood/40">
                      {event.type === 'workshop' ? 'Workshop' : event.type}
                    </span>
                    <span className="text-chartreuse font-host-grotesk text-sm font-semibold flex items-center gap-1">
                      View Details <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/50 rounded-2xl p-12 border border-rosewood/5">
              <ArchiveIcon className="w-16 h-16 text-rosewood/20 mx-auto mb-4" />
              <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">No archived events</h3>
              <p className="font-host-grotesk text-rosewood/40 mt-2">
                Past events will automatically appear here when they are archived.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}