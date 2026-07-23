'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Trash2, RefreshCw, Users, MapPin, 
  Eye, ChevronDown, ChevronUp, Search,
  Mail, Phone, Ticket, Briefcase, FileText, LogOut, X,
  Calendar, Filter, Download, ChevronRight
} from 'lucide-react'

interface Submission {
  id: string
  timestamp: string
  type: 'vendor' | 'rsvp'
  data: Record<string, string | number | string[] | undefined>
}

type SortField = 'date' | 'name' | 'type' | 'city' | 'tickets'
type SortOrder = 'asc' | 'desc'

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'vendor' | 'rsvp'>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [stats, setStats] = useState({
    total: 0,
    vendors: 0,
    rsvps: 0,
    cities: {} as Record<string, number>
  })
  const [cityDetails, setCityDetails] = useState<Record<string, { name: string, email: string, tickets: number }[]>>({})
  
  const router = useRouter()

  
const getCityName = (data: Record<string, string | number | string[] | undefined>) => {
  // Check for selectedCities array (vendors can select multiple cities)
  const selectedCities = data.selectedCities as Array<{ city?: string; name?: string } | string> | undefined
  if (selectedCities && Array.isArray(selectedCities) && selectedCities.length > 0) {
    // Return each city as a separate entry for city breakdown
    // But for display in the table, show all cities
    const cityNames = selectedCities.map((c) =>
      typeof c === 'string' ? c : c.city || c.name || 'Unknown'
    )
    // For the table display, join them with comma
    // But for the city breakdown, we need to handle each city separately
    return cityNames.join(', ')
  }
  
  // For RSVP forms - use eventCity (the tour city name)
  if (data.eventCity) {
    return String(data.eventCity)
  }
  
  // For vendor forms - if they only selected one city
  if (data.city) {
    return String(data.city)
  }
  
  return 'Unknown'
}

const calculateStats = useCallback((data: Submission[]) => {
  const vendors = data.filter(s => s.type === 'vendor')
  const rsvps = data.filter(s => s.type === 'rsvp')
  
  const cityCount: Record<string, number> = {}
  const cityDetailsData: Record<string, { name: string, email: string, tickets: number }[]> = {}
  
  data.forEach(s => {
    // For vendors with multiple cities, count each city separately
    if (s.type === 'vendor' && s.data.selectedCities && Array.isArray(s.data.selectedCities)) {
      const selectedCities = s.data.selectedCities as Array<{ city?: string; name?: string } | string>
      selectedCities.forEach((c) => {
        const cityName = typeof c === 'string' ? c : c.city || c.name || 'Unknown'
        cityCount[cityName] = (cityCount[cityName] || 0) + 1
        
        if (!cityDetailsData[cityName]) cityDetailsData[cityName] = []
        cityDetailsData[cityName].push({
          name: String(s.data.fullName || s.data.businessName || 'Unknown'),
          email: String(s.data.email || ''),
          tickets: 0
        })
      })
    } else {
      // For RSVPs or vendors with single city
      const city = getCityName(s.data)
      cityCount[city] = (cityCount[city] || 0) + 1
      
      if (!cityDetailsData[city]) cityDetailsData[city] = []
      
      const tickets = s.type === 'rsvp' ? parseInt(String(s.data.tickets || '0')) || 0 : 0
      
      cityDetailsData[city].push({
        name: String(s.data.fullName || s.data.businessName || 'Unknown'),
        email: String(s.data.email || ''),
        tickets: tickets
      })
    }
  })

  setStats({
    total: data.length,
    vendors: vendors.length,
    rsvps: rsvps.length,
    cities: cityCount
  })
  setCityDetails(cityDetailsData)
}, [])

  const fetchData = useCallback(async () => {
  try {
    const response = await fetch('/api/admin/data')
    if (response.status === 401) {
      router.push('/admin/login')
      return
    }
    const data = await response.json()
    // Only update state if component is still mounted
    setSubmissions(data.submissions || [])
    calculateStats(data.submissions || [])
  } catch (error) {
    console.error('Failed to fetch data', error)
  } finally {
    setLoading(false)
  }
}, [router, calculateStats])

useEffect(() => {
  let isMounted = true
  
  const loadData = async () => {
    if (!isMounted) return
    await fetchData()
  }
  
  loadData()
  
  return () => {
    isMounted = false
  }
}, [fetchData])

  useEffect(() => {
    const loadData = async () => {
      await fetchData()
    }

    void loadData()
  }, [fetchData])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this submission?')) return
    try {
      await fetch('/api/admin/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      await fetchData()
    } catch (error) {
      console.error('Failed to delete', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  const getFilteredAndSorted = () => {
    let filtered = submissions
    
    if (filter !== 'all') {
      filtered = filtered.filter(s => s.type === filter)
    }
    
    if (cityFilter !== 'all') {
      filtered = filtered.filter(s => getCityName(s.data) === cityFilter)
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(s => {
        const searchable = [
          String(s.data.fullName || ''),
          String(s.data.businessName || ''),
          String(s.data.email || ''),
          String(getCityName(s.data) || ''),
          String(s.data.venue || ''),
          String(s.data.phone || '')
        ].join(' ').toLowerCase()
        return searchable.includes(term)
      })
    }
    
    filtered.sort((a, b) => {
      let aVal: string | number, bVal: string | number
      switch (sortField) {
        case 'date':
          aVal = new Date(a.timestamp).getTime()
          bVal = new Date(b.timestamp).getTime()
          break
        case 'name':
          aVal = String(a.data.fullName || a.data.businessName || '').toLowerCase()
          bVal = String(b.data.fullName || b.data.businessName || '').toLowerCase()
          break
        case 'type':
          aVal = a.type
          bVal = b.type
          break
        case 'city':
          aVal = getCityName(a.data).toLowerCase()
          bVal = getCityName(b.data).toLowerCase()
          break
        case 'tickets':
          aVal = parseInt(String(a.data.tickets || '0'))
          bVal = parseInt(String(b.data.tickets || '0'))
          break
        default:
          return 0
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }

  const filteredSubmissions = getFilteredAndSorted()
  const cityStats = Object.entries(stats.cities).sort((a, b) => b[1] - a[1])
  const cityOptions = Object.keys(stats.cities).sort()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading...</div>
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
              {stats.total} submissions
            </p>
          </div>
          <div className="flex gap-3">
            <button
            
              onClick={() => {
                console.log('Refresh clicked')
                fetchData()
                }}
                className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="bg-rosewood/10 hover:bg-rosewood/20 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-chartreuse/10 p-2 rounded-lg">
                <Users className="w-5 h-5 text-chartreuse" />
              </div>
              <div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.total}</p>
                <p className="font-host-grotesk text-sm text-rosewood/40">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-henna/10 p-2 rounded-lg">
                <Briefcase className="w-5 h-5 text-henna" />
              </div>
              <div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.vendors}</p>
                <p className="font-host-grotesk text-sm text-rosewood/40">Vendors</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-cypress/10 p-2 rounded-lg">
                <Ticket className="w-5 h-5 text-cypress" />
              </div>
              <div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.rsvps}</p>
                <p className="font-host-grotesk text-sm text-rosewood/40">RSVPs</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-olive/10 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-olive" />
              </div>
              <div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">{Object.keys(stats.cities).length}</p>
                <p className="font-host-grotesk text-sm text-rosewood/40">Cities</p>
              </div>
            </div>
          </div>
        </div>

        {/* City Breakdown with Details */}
        {cityStats.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm mb-8">
            <h3 className="font-host-grotesk font-semibold text-sm text-rosewood/60 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              City Breakdown
            </h3>
            <div className="space-y-3">
              {cityStats.map(([city, count]) => (
                <div key={city}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-host-grotesk font-semibold text-sm text-rosewood">{city}</span>
                      <span className="bg-chartreuse/10 text-chartreuse text-xs font-bold px-2 py-0.5 rounded-full">
                        {count} people
                      </span>
                    </div>
                    <button
                      onClick={() => setCityFilter(cityFilter === city ? 'all' : city)}
                      className="text-xs text-rosewood/40 hover:text-rosewood transition-colors flex items-center gap-1"
                    >
                      {cityFilter === city ? 'Clear filter' : 'Filter'}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="bg-plaster/30 rounded-lg p-3 text-xs font-host-grotesk text-rosewood/60 space-y-1">
                    {cityDetails[city]?.slice(0, 5).map((person, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="font-medium text-rosewood">{person.name}</span>
                        {person.tickets > 0 && (
                          <span className="text-chartreuse">{person.tickets} ticket{person.tickets > 1 ? 's' : ''}</span>
                        )}
                        {person.email && (
                          <span className="text-rosewood/40">{person.email}</span>
                        )}
                      </div>
                    ))}
                    {cityDetails[city]?.length > 5 && (
                      <div className="text-rosewood/40 mt-1">
                        +{cityDetails[city].length - 5} more...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all ${
                filter === 'all' ? 'bg-rosewood text-plaster' : 'bg-white text-rosewood/60 hover:bg-white/80'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('vendor')}
              className={`px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all ${
                filter === 'vendor' ? 'bg-rosewood text-plaster' : 'bg-white text-rosewood/60 hover:bg-white/80'
              }`}
            >
              Vendors ({stats.vendors})
            </button>
            <button
              onClick={() => setFilter('rsvp')}
              className={`px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all ${
                filter === 'rsvp' ? 'bg-rosewood text-plaster' : 'bg-white text-rosewood/60 hover:bg-white/80'
              }`}
            >
              RSVPs ({stats.rsvps})
            </button>
          </div>
          
          {/* City Filter Dropdown */}
          {cityOptions.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
            >
              <option value="all">All Cities</option>
              {cityOptions.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          )}
          
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rosewood/30" />
              <input
                type="text"
                placeholder="Search by name, email, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-rosewood/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-sm text-rosewood"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-rosewood/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rosewood/10 bg-plaster/30">
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase tracking-wider text-rosewood/50 cursor-pointer hover:text-rosewood/80" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date {getSortIcon('date')}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase tracking-wider text-rosewood/50 cursor-pointer hover:text-rosewood/80" onClick={() => handleSort('type')}>
                    <div className="flex items-center gap-1">
                      Type {getSortIcon('type')}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase tracking-wider text-rosewood/50 cursor-pointer hover:text-rosewood/80" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Name {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase tracking-wider text-rosewood/50">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase tracking-wider text-rosewood/50 cursor-pointer hover:text-rosewood/80" onClick={() => handleSort('city')}>
                    <div className="flex items-center gap-1">
                      City {getSortIcon('city')}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase tracking-wider text-rosewood/50 cursor-pointer hover:text-rosewood/80" onClick={() => handleSort('tickets')}>
                    <div className="flex items-center gap-1">
                      Tickets {getSortIcon('tickets')}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase tracking-wider text-rosewood/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center font-host-grotesk text-rosewood/40">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-rosewood/20" />
                        <p>No submissions</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="border-b border-rosewood/5 hover:bg-plaster/20 transition-colors">
                      <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/50 whitespace-nowrap">
                        {new Date(sub.timestamp).toLocaleDateString()}
                      </td>
                      
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          sub.type === 'vendor' 
                            ? 'bg-chartreuse/10 text-chartreuse' 
                            : 'bg-cypress/10 text-cypress'
                        }`}>
                          {sub.type === 'vendor' ? 'Vendor' : 'RSVP'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood font-semibold">
                        {String(sub.data.fullName || sub.data.businessName || 'N/A')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {sub.data.email && (
                            <span className="font-host-grotesk text-xs text-rosewood/50 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {String(sub.data.email)}
                            </span>
                          )}
                          {sub.data.phone && (
                            <span className="font-host-grotesk text-xs text-rosewood/50 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {String(sub.data.phone)}
                            </span>
                          )}
                          {sub.data.instagram && (
                            <span className="font-host-grotesk text-xs text-rosewood/50 flex items-center gap-1">
                              {/* <Instagram className="w-3 h-3" /> */}
                              @{String(sub.data.instagram)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/60">
                        {getCityName(sub.data)}
                      </td>
                      <td className="px-4 py-3">
                        {sub.type === 'rsvp' && sub.data.tickets && (
                          <span className="bg-chartreuse/10 text-chartreuse text-xs px-2 py-1 rounded-full inline-block">
                            {String(sub.data.tickets)}
                          </span>
                        )}
                        {sub.type === 'vendor' && sub.data.businessName && (
                          <span className="bg-henna/10 text-henna text-xs px-2 py-1 rounded-full inline-block">
                            {String(sub.data.businessName)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="text-rosewood/30 hover:text-rosewood/60 transition-colors p-1"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="text-rosewood/30 hover:text-poppy transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-center font-host-grotesk text-xs text-rosewood/30">
          {filteredSubmissions.length} of {submissions.length} shown
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-rosewood/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedSubmission(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-rosewood/10 p-6 flex items-center justify-between">
              <div>
                <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">
                  Details
                </h3>
                <p className="font-host-grotesk text-sm text-rosewood/50">
                  {new Date(selectedSubmission.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 hover:bg-plaster/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-rosewood/60" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  selectedSubmission.type === 'vendor' 
                    ? 'bg-chartreuse/10 text-chartreuse' 
                    : 'bg-cypress/10 text-cypress'
                }`}>
                  {selectedSubmission.type === 'vendor' ? 'Vendor' : 'RSVP'}
                </span>
                {selectedSubmission.type === 'rsvp' && selectedSubmission.data.tickets && (
                  <span className="bg-chartreuse/10 text-chartreuse text-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <Ticket className="w-4 h-4" />
                    {String(selectedSubmission.data.tickets)} tickets
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedSubmission.data).map(([key, value]) => {
                  if (!value || value === '' || key === '_subject' || key === '_replyto') return null
                  
                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())
                    .replace(/([a-z])([A-Z])/g, '$1 $2')
                  
                  return (
                    <div key={key} className="bg-plaster/30 rounded-xl p-3">
                      <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="font-host-grotesk text-sm text-rosewood font-medium mt-1 break-words">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}