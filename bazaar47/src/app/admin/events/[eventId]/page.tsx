'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar, MapPin, Users, Ticket, 
  Building2, Download, RefreshCw, BarChart3,
  List, Users2, Music2
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface EventData {
  id: string
  slug: string
  name: string
  type: 'tour' | 'block-party' | 'concert' | 'custom'
  status: 'upcoming' | 'active' | 'past' | 'completed'
  date: string
  dateDisplay: string
  time: string
  location: string
  address: string
  city?: string
  capacity?: number
  hasVendors: boolean
  hasRSVP: boolean
  hasDanceSignup: boolean
  isFree: boolean
  price?: number
  description: string
}

interface SubmissionData {
  id: string
  timestamp: string
  type: 'vendor' | 'rsvp' | 'dance-signup' | 'ticket'
  eventId: string
  eventSlug: string
  data: Record<string, string | number | string[] | boolean | undefined>
}

interface EventStats {
  total: number
  vendors: number
  rsvps: number
  danceSignups: number
  tickets: number
}

interface CityBreakdown {
  [city: string]: {
    vendors: number
    rsvps: number
    tickets: number
  }
}

interface BreakdownData {
  vendors: Record<string, string | number | string[] | boolean | undefined>[]
  rsvps: Record<string, string | number | string[] | boolean | undefined>[]
  danceSignups: Record<string, string | number | string[] | boolean | undefined>[]
}

interface EventDetail {
  event: EventData
  stats: EventStats
  submissions: SubmissionData[]
  cityBreakdown: CityBreakdown
  breakdown: BreakdownData
  capacity: number
  fillRate: number
}

// ============================================
// TAB COMPONENT PROPS
// ============================================

interface OverviewTabProps {
  event: EventData
  stats: EventStats
  cityBreakdown: CityBreakdown
  breakdown: BreakdownData
  fillRate: number
  capacity: number
}

interface SubmissionsTabProps {
  submissions: SubmissionData[]
}

interface StatsTabProps {
  event: EventData
  stats: EventStats
  cityBreakdown: CityBreakdown
  breakdown: BreakdownData
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  
  const [data, setData] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'stats'>('overview')

  const fetchEventData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/events/${eventId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Event not found')
        } else {
          setError('Failed to load event data')
        }
        setLoading(false)
        return
      }
      
      const result = await response.json()
      
      // ✅ Check if result has the expected structure
      if (!result || !result.event) {
        setError('Invalid data received from server')
        setLoading(false)
        return
      }
      
      setData(result)
    } catch (error) {
      console.error('Failed to fetch event:', error)
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    // Defer the fetch so its state updates happen after the effect completes.
    const timeoutId = window.setTimeout(() => {
      fetchEventData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchEventData])

  // ✅ Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading event...</div>
      </div>
    )
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-plaster p-4">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">⚠️ Error</div>
        <div className="text-rosewood/60 font-host-grotesk">{error}</div>
        <Link 
          href="/admin" 
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  // ✅ No data state
  if (!data || !data.event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-plaster p-4">
        <div className="text-rosewood/60 font-host-grotesk">Event not found</div>
        <Link 
          href="/admin" 
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const { event, stats, submissions, cityBreakdown, breakdown, capacity, fillRate } = data

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Back Button & Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/admin" 
            className="text-rosewood/60 hover:text-rosewood transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
              {event.name || 'Untitled Event'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-rosewood/50 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {event.dateDisplay || event.date || 'TBD'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location || 'TBD'}
              </span>
              {capacity && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {stats?.tickets || 0}/{capacity} tickets
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                event.status === 'active' 
                  ? 'bg-chartreuse/10 text-chartreuse' 
                  : event.status === 'completed'
                  ? 'bg-rosewood/10 text-rosewood/50'
                  : 'bg-hippie/10 text-hippie'
              }`}>
                {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Unknown'}
              </span>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={fetchEventData}
              className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                // Export CSV logic
              }}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-xs text-rosewood/40">Total Submissions</p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats?.total || 0}</p>
          </div>
          {event.hasVendors && (
            <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
              <p className="font-host-grotesk text-xs text-rosewood/40">Vendors</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats?.vendors || 0}</p>
            </div>
          )}
          {event.hasRSVP && (
            <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
              <p className="font-host-grotesk text-xs text-rosewood/40">RSVPs</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats?.rsvps || 0}</p>
            </div>
          )}
          {event.hasDanceSignup && (
            <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
              <p className="font-host-grotesk text-xs text-rosewood/40">Dance Signups</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats?.danceSignups || 0}</p>
            </div>
          )}
          {capacity && (
            <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
              <p className="font-host-grotesk text-xs text-rosewood/40">Fill Rate</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">{fillRate || 0}%</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-rosewood/10 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-host-grotesk font-semibold text-sm transition-all ${
              activeTab === 'overview' 
                ? 'text-rosewood border-b-2 border-rosewood' 
                : 'text-rosewood/40 hover:text-rosewood/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 font-host-grotesk font-semibold text-sm transition-all ${
              activeTab === 'submissions' 
                ? 'text-rosewood border-b-2 border-rosewood' 
                : 'text-rosewood/40 hover:text-rosewood/60'
            }`}
          >
            <List className="w-4 h-4 inline mr-1" />
            Submissions ({submissions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 font-host-grotesk font-semibold text-sm transition-all ${
              activeTab === 'stats' 
                ? 'text-rosewood border-b-2 border-rosewood' 
                : 'text-rosewood/40 hover:text-rosewood/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />
            Statistics
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <OverviewTab 
              event={event} 
              stats={stats} 
              cityBreakdown={cityBreakdown || {}}
              breakdown={breakdown || { vendors: [], rsvps: [], danceSignups: [] }}
              fillRate={fillRate || 0}
              capacity={capacity || 0}
            />
          )}
          {activeTab === 'submissions' && (
            <SubmissionsTab submissions={submissions || []} />
          )}
          {activeTab === 'stats' && (
            <StatsTab 
              event={event}
              stats={stats}
              cityBreakdown={cityBreakdown || {}}
              breakdown={breakdown || { vendors: [], rsvps: [], danceSignups: [] }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({ 
  event, 
  stats, 
  cityBreakdown, 
  breakdown, 
  fillRate, 
  capacity 
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* City Breakdown - For Tour Events */}
      {event.type === 'tour' && cityBreakdown && Object.keys(cityBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-rosewood/5 shadow-sm">
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-4">
            City Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(cityBreakdown).map(([city, data]) => (
              <div key={city} className="flex items-center justify-between p-3 bg-plaster/30 rounded-xl">
                <span className="font-host-grotesk font-semibold text-rosewood">{city}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-rosewood/50">Vendors: <strong className="text-rosewood">{data.vendors}</strong></span>
                  <span className="text-rosewood/50">RSVPs: <strong className="text-rosewood">{data.rsvps}</strong></span>
                  <span className="text-rosewood/50">Tickets: <strong className="text-rosewood">{data.tickets}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {breakdown.vendors && breakdown.vendors.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-rosewood/5 shadow-sm">
            <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Recent Vendors
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {breakdown.vendors.slice(0, 5).map((vendor, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-plaster/30 rounded-lg text-sm">
                  <span className="font-medium text-rosewood">
                    {String(vendor.businessName || vendor.fullName || 'Unknown')}
                  </span>
                  <span className="text-rosewood/40">{String(vendor.email || '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {breakdown.rsvps && breakdown.rsvps.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-rosewood/5 shadow-sm">
            <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-3 flex items-center gap-2">
              <Users2 className="w-5 h-5" />
              Recent RSVPs
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {breakdown.rsvps.slice(0, 5).map((rsvp, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-plaster/30 rounded-lg text-sm">
                  <span className="font-medium text-rosewood">
                    {String(rsvp.fullName || 'Unknown')}
                  </span>
                  <span className="text-rosewood/40">
                    {rsvp.tickets ? `${rsvp.tickets} tickets` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// SUBMISSIONS TAB
// ============================================

function SubmissionsTab({ submissions }: SubmissionsTabProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vendor': return 'bg-chartreuse/10 text-chartreuse'
      case 'rsvp': return 'bg-cypress/10 text-cypress'
      case 'dance-signup': return 'bg-hippie/10 text-hippie'
      default: return 'bg-rosewood/10 text-rosewood'
    }
  }

  const getDisplayName = (submission: SubmissionData) => {
    const data = submission.data
    if (data.fullName) return String(data.fullName)
    if (data.businessName) return String(data.businessName)
    if (data.dancerName) return String(data.dancerName)
    return 'N/A'
  }

  const getDetails = (submission: SubmissionData) => {
    const data = submission.data
    const parts: string[] = []
    if (data.tickets) parts.push(`${data.tickets} tickets`)
    if (data.businessName) parts.push(`@ ${data.businessName}`)
    if (data.dancerName) parts.push(`🎤 ${data.dancerName}`)
    return parts.join(' ') || '—'
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm">
        <div className="text-center py-12 text-rosewood/40 font-host-grotesk">
          No submissions yet
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-plaster/30">
            <tr>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Type</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Name</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Email</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Details</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Date</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-t border-rosewood/5 hover:bg-plaster/20">
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTypeColor(submission.type)}`}>
                    {submission.type.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood">
                  {getDisplayName(submission)}
                </td>
                <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/50">
                  {String(submission.data.email || '')}
                </td>
                <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/50">
                  {getDetails(submission)}
                </td>
                <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/40">
                  {new Date(submission.timestamp).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================
// STATS TAB
// ============================================

function StatsTab({ event, stats, cityBreakdown, breakdown }: StatsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-rosewood/5 shadow-sm">
          <p className="font-host-grotesk text-sm text-rosewood/40">Total Submissions</p>
          <p className="font-host-grotesk text-3xl font-bold text-rosewood">{stats.total}</p>
        </div>
        {event.hasVendors && (
          <div className="bg-white rounded-2xl p-6 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-sm text-rosewood/40">Total Vendors</p>
            <p className="font-host-grotesk text-3xl font-bold text-rosewood">{stats.vendors}</p>
          </div>
        )}
        {event.hasRSVP && (
          <div className="bg-white rounded-2xl p-6 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-sm text-rosewood/40">Total Tickets</p>
            <p className="font-host-grotesk text-3xl font-bold text-rosewood">{stats.tickets}</p>
          </div>
        )}
      </div>

      {/* City Breakdown Stats */}
      {event.type === 'tour' && cityBreakdown && Object.keys(cityBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-rosewood/5 shadow-sm">
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-4">
            City Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(cityBreakdown).map(([city, data]) => (
              <div key={city} className="bg-plaster/30 rounded-xl p-4">
                <p className="font-host-grotesk font-bold text-rosewood">{city}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-rosewood/50">Vendors: <span className="text-rosewood font-semibold">{data.vendors}</span></p>
                  <p className="text-rosewood/50">RSVPs: <span className="text-rosewood font-semibold">{data.rsvps}</span></p>
                  <p className="text-rosewood/50">Tickets: <span className="text-rosewood font-semibold">{data.tickets}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}