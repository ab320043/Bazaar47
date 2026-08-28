'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar, MapPin, Users, Ticket, 
  Building2, Download, RefreshCw, BarChart3,
  List, Users2, Music2, Search, Edit, Trash2,
  X, CheckCircle, Clock, AlertCircle
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
  breakdown: BreakdownData
}

interface SubmissionsTabProps {
  submissions: SubmissionData[]
  onDelete: (id: string) => void
  onEdit: (submission: SubmissionData) => void
  onRefresh: () => void
}

interface StatsTabProps {
  event: EventData
  stats: EventStats
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
  const [searchTerm, setSearchTerm] = useState('')
  const [submissionTypeFilter, setSubmissionTypeFilter] = useState<string>('all')
  const [editingSubmission, setEditingSubmission] = useState<SubmissionData | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

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
    const timeoutId = window.setTimeout(() => {
      fetchEventData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchEventData])

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return
    
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      
      if (response.ok) {
        await fetchEventData()
      } else {
        alert('Failed to delete submission')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete submission')
    }
  }

  const handleEditSubmission = (submission: SubmissionData) => {
    setEditingSubmission(submission)
    setShowEditModal(true)
  }

  const handleSaveEdit = async (updatedData: Record<string, unknown>) => {
    if (!editingSubmission) return
    
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingSubmission.id,
          data: updatedData 
        }),
      })
      
      if (response.ok) {
        setShowEditModal(false)
        setEditingSubmission(null)
        await fetchEventData()
      } else {
        alert('Failed to update submission')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update submission')
    }
  }

  const handleExportCSV = () => {
    if (!data || !data.submissions || data.submissions.length === 0) {
      alert('No submissions to export')
      return
    }

    // Get all unique field names from all submissions
    const allFields = new Set<string>()
    data.submissions.forEach(submission => {
      Object.keys(submission.data).forEach(key => {
        allFields.add(key)
      })
    })
    
    // Add standard fields that might not be in data
    const standardFields = ['type', 'timestamp', 'id']
    standardFields.forEach(field => allFields.add(field))
    
    const fieldArray = Array.from(allFields)
    
    // Build CSV headers
    const headers = fieldArray
    
    // Build CSV rows
    const rows = data.submissions.map(submission => {
      return fieldArray.map(field => {
        if (field === 'type') return submission.type
        if (field === 'timestamp') return submission.timestamp
        if (field === 'id') return submission.id
        const value = submission.data[field]
        if (value === undefined || value === null) return ''
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return String(value)
      })
    })

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.event.name}-submissions-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Filter submissions
  const getFilteredSubmissions = () => {
    if (!data) return []
    
    let filtered = data.submissions
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(s => {
        const searchable = [
          s.data.fullName,
          s.data.businessName,
          s.data.email,
          s.data.dancerName,
          s.data.city,
          s.data.eventCity,
          s.data.phone,
          s.data.phoneNumber,
        ].filter(Boolean).join(' ').toLowerCase()
        return searchable.includes(search)
      })
    }
    
    // Type filter
    if (submissionTypeFilter !== 'all') {
      filtered = filtered.filter(s => s.type === submissionTypeFilter)
    }
    
    return filtered
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading event...</div>
      </div>
    )
  }

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
  const filteredSubmissions = getFilteredSubmissions()

  // Get unique submission types for filter
  const submissionTypes = ['all', ...new Set(submissions.map(s => s.type))]

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
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                event.status === 'active' 
                  ? 'bg-chartreuse/10 text-chartreuse' 
                  : event.status === 'completed'
                  ? 'bg-rosewood/10 text-rosewood/50'
                  : event.status === 'upcoming'
                  ? 'bg-pomegranate/10 text-pomegranate'
                  : 'bg-grove/10 text-grove'
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
              onClick={handleExportCSV}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Overview Cards - No ticket count display */}
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
            Submissions ({filteredSubmissions.length})
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
              breakdown={breakdown}
            />
          )}
          {activeTab === 'submissions' && (
            <SubmissionsTab 
              submissions={filteredSubmissions}
              onDelete={handleDeleteSubmission}
              onEdit={handleEditSubmission}
              onRefresh={fetchEventData}
            />
          )}
          {activeTab === 'stats' && (
            <StatsTab 
              event={event}
              stats={stats}
              breakdown={breakdown}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingSubmission && (
        <EditModal
          submission={editingSubmission}
          onSave={handleSaveEdit}
          onClose={() => {
            setShowEditModal(false)
            setEditingSubmission(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================
// OVERVIEW TAB - No City Breakdown
// ============================================

function OverviewTab({ 
  event, 
  stats, 
  breakdown 
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Event Info */}
      <div className="bg-white rounded-2xl p-6 border border-rosewood/5 shadow-sm">
        <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-3">Event Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-rosewood/40">Name</p>
            <p className="font-host-grotesk font-semibold text-rosewood">{event.name}</p>
          </div>
          <div>
            <p className="text-sm text-rosewood/40">Type</p>
            <p className="font-host-grotesk font-semibold text-rosewood">{event.type}</p>
          </div>
          <div>
            <p className="text-sm text-rosewood/40">Date</p>
            <p className="font-host-grotesk font-semibold text-rosewood">{event.dateDisplay || event.date}</p>
          </div>
          <div>
            <p className="text-sm text-rosewood/40">Location</p>
            <p className="font-host-grotesk font-semibold text-rosewood">{event.location}</p>
          </div>
          <div>
            <p className="text-sm text-rosewood/40">Status</p>
            <p className="font-host-grotesk font-semibold text-rosewood">{event.status}</p>
          </div>
          <div>
            <p className="text-sm text-rosewood/40">Price</p>
            <p className="font-host-grotesk font-semibold text-rosewood">
              {event.isFree ? 'Free' : `$${event.price}`}
            </p>
          </div>
        </div>
      </div>

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
// SUBMISSIONS TAB - With Search & Filters
// ============================================

function SubmissionsTab({ submissions, onDelete, onEdit, onRefresh }: SubmissionsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'name' | 'date' | 'type' | 'phone'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Get unique types
  const types = ['all', ...new Set(submissions.map(s => s.type))]

  // Filter submissions
  const filtered = submissions.filter(s => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const data = s.data
      const searchable = [
        data.fullName,
        data.businessName,
        data.email,
        data.dancerName,
        data.city,
        data.phone,
        data.phoneNumber,
      ].filter(Boolean).join(' ').toLowerCase()
      if (!searchable.includes(search)) return false
    }
    if (typeFilter !== 'all' && s.type !== typeFilter) return false
    return true
  })

  // Sort submissions
  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number = ''
    let bVal: string | number = ''
    
    switch (sortField) {
      case 'name':
        aVal = String(a.data.fullName || a.data.businessName || a.data.dancerName || '')
        bVal = String(b.data.fullName || b.data.businessName || b.data.dancerName || '')
        break
      case 'phone':
        aVal = String(a.data.phone || a.data.phoneNumber || '')
        bVal = String(b.data.phone || b.data.phoneNumber || '')
        break
      case 'date':
        aVal = new Date(a.timestamp).getTime()
        bVal = new Date(b.timestamp).getTime()
        break
      case 'type':
        aVal = a.type
        bVal = b.type
        break
    }
    
    if (sortOrder === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vendor': return 'bg-chartreuse/10 text-chartreuse'
      case 'rsvp': return 'bg-cypress/10 text-cypress'
      case 'dance-signup': return 'bg-pomegranate/10 text-pomegranate'
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

  const getPhone = (submission: SubmissionData) => {
    const data = submission.data
    return String(data.phone || data.phoneNumber || '')
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
      <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-8">
        <div className="text-center py-12 text-rosewood/40 font-host-grotesk">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-rosewood/20" />
          <p>No submissions yet</p>
          <p className="text-sm mt-1">Submissions will appear here once people sign up</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
      {/* Search and Filters */}
      <div className="p-4 border-b border-rosewood/10 flex flex-wrap items-center gap-4 bg-plaster/20">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rosewood/30" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-rosewood/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-sm text-rosewood"
            />
          </div>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
        >
          <option value="all">All Types</option>
          {types.filter(t => t !== 'all').map(type => (
            <option key={type} value={type}>{type.replace('-', ' ')}</option>
          ))}
        </select>

        <button
          onClick={onRefresh}
          className="text-rosewood/40 hover:text-rosewood transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <span className="text-sm text-rosewood/40 ml-auto">
          {sorted.length} of {submissions.length} shown
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-plaster/30">
            <tr>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50 cursor-pointer hover:text-rosewood/80" onClick={() => {
                if (sortField === 'type') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                else { setSortField('type'); setSortOrder('asc') }
              }}>
                Type {sortField === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50 cursor-pointer hover:text-rosewood/80" onClick={() => {
                if (sortField === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                else { setSortField('name'); setSortOrder('asc') }
              }}>
                Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Email</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50 cursor-pointer hover:text-rosewood/80" onClick={() => {
                if (sortField === 'phone') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                else { setSortField('phone'); setSortOrder('asc') }
              }}>
                Phone {sortField === 'phone' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Details</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50 cursor-pointer hover:text-rosewood/80" onClick={() => {
                if (sortField === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                else { setSortField('date'); setSortOrder('asc') }
              }}>
                Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((submission) => (
              <tr key={submission.id} className="border-t border-rosewood/5 hover:bg-plaster/20 transition-colors">
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTypeColor(submission.type)}`}>
                    {submission.type.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood font-medium">
                  {getDisplayName(submission)}
                </td>
                <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/50">
                  {String(submission.data.email || '')}
                </td>
                <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/50">
                  {getPhone(submission)}
                </td>
                <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/50">
                  {getDetails(submission)}
                </td>
                <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/40">
                  {new Date(submission.timestamp).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(submission)}
                      className="text-rosewood/30 hover:text-chartreuse transition-colors p-1"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(submission.id)}
                      className="text-rosewood/30 hover:text-poppy transition-colors p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

function StatsTab({ event, stats, breakdown }: StatsTabProps) {
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

      {/* Vendor Breakdown */}
      {breakdown.vendors && breakdown.vendors.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-rosewood/5 shadow-sm">
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-4">Vendor List</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {breakdown.vendors.map((vendor, index) => (
              <div key={index} className="bg-plaster/30 rounded-xl p-3">
                <p className="font-host-grotesk font-semibold text-rosewood">
                  {String(vendor.businessName || vendor.fullName || 'Unknown')}
                </p>
                <p className="text-sm text-rosewood/40">{String(vendor.email || '')}</p>
                {vendor.products && (
                  <p className="text-xs text-rosewood/30 mt-1">{String(vendor.products)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RSVP Breakdown */}
      {breakdown.rsvps && breakdown.rsvps.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-rosewood/5 shadow-sm">
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-4">RSVP List</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {breakdown.rsvps.map((rsvp, index) => (
              <div key={index} className="bg-plaster/30 rounded-xl p-3">
                <p className="font-host-grotesk font-semibold text-rosewood">
                  {String(rsvp.fullName || 'Unknown')}
                </p>
                <p className="text-sm text-rosewood/40">{String(rsvp.email || '')}</p>
                {rsvp.tickets && (
                  <p className="text-xs text-chartreuse font-semibold">{rsvp.tickets} tickets</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// EDIT MODAL
// ============================================

function EditModal({ 
  submission, 
  onSave, 
  onClose 
}: { 
  submission: SubmissionData
  onSave: (data: Record<string, string | number | string[] | boolean | undefined>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState(submission.data)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-rosewood/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-rosewood/10 p-6 flex items-center justify-between">
          <div>
            <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">Edit Submission</h3>
            <p className="font-host-grotesk text-sm text-rosewood/50">
              {submission.type} • {new Date(submission.timestamp).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-plaster/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-rosewood/60" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {Object.entries(formData).map(([key, value]) => {
            // Skip internal fields
            if (['_subject', '_replyto'].includes(key)) return null
            
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase())
            
            return (
              <div key={key}>
                <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                  {label}
                </label>
                {typeof value === 'string' && value.length > 100 ? (
                  <textarea
                    value={String(value)}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                  />
                ) : typeof value === 'string' || typeof value === 'number' ? (
                  <input
                    type="text"
                    value={String(value)}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                  />
                ) : typeof value === 'object' ? (
                  <pre className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl font-host-grotesk text-sm text-rosewood overflow-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <input
                    type="text"
                    value={String(value)}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                  />
                )}
              </div>
            )
          })}
          
          <div className="flex gap-3 pt-4 border-t border-rosewood/10">
            <button
              type="submit"
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-rosewood/10 hover:bg-rosewood/20 text-rosewood/60 px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}