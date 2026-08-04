'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, Users, Ticket, Calendar, MapPin, TrendingUp, 
  TrendingDown, Percent, Filter, Download, RefreshCw,
  ChevronDown, ChevronUp, Eye, Clock, CheckCircle, XCircle,
  UserPlus, Building2, PartyPopper, Gift, Coffee, TrendingUp as TrendingUpIcon
} from 'lucide-react'

interface Submission {
  id: string
  timestamp: string
  type: 'vendor' | 'rsvp'
  data: Record<string, string | number | string[] | undefined>
}

interface CityStats {
  name: string
  total: number
  vendors: number
  rsvps: number
  softOpening: number
  totalTickets: number
  capacity?: number
  percentage?: number
}

interface EventStats {
  totalSubmissions: number
  totalVendors: number
  totalRSVPs: number
  totalSoftOpening: number
  uniqueCities: number
  totalTickets: number
  conversionRate: number
}

export default function StatisticsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'vendors' | 'rsvps' | 'soft-opening'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'total' | 'tickets' | 'percentage'>('tickets')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  // City capacity mapping - adjust these numbers as needed
  const cityCapacities: Record<string, number> = {
    'Orlando': 100,
    'South Florida': 200,
    'Jacksonville': 120,
    'Gainesville | The FEST': 150,
    'Gainesville': 100,
    'Tampa': 180,
    'Gulf Coast': 180,
  }

  const getCityName = useCallback((data: Record<string, string | number | string[] | undefined>): string => {
    const selectedCities = data.selectedCities as Array<{ city?: string; name?: string } | string> | undefined
    if (selectedCities && Array.isArray(selectedCities) && selectedCities.length > 0) {
      const cityNames = selectedCities.map((c) =>
        typeof c === 'string' ? c : c.city || c.name || 'Unknown'
      )
      return cityNames.join(', ')
    }
    if (data.eventCity) {
      return String(data.eventCity)
    }
    if (data.city) {
      return String(data.city)
    }
    return 'Unknown'
  }, [])

  const calculateStats = useCallback((data: Submission[]): EventStats => {
    const vendors = data.filter(s => s.type === 'vendor')
    const rsvps = data.filter(s => s.type === 'rsvp')
    const softOpening = data.filter(s => s.data?.eventType === 'soft-opening')
    
    const uniqueCities = new Set<string>()
    let totalTickets = 0
    
    data.forEach(s => {
      const city = getCityName(s.data)
      uniqueCities.add(city)
      if (s.type === 'rsvp' && s.data.tickets) {
        totalTickets += parseInt(String(s.data.tickets)) || 0
      }
    })

    return {
      totalSubmissions: data.length,
      totalVendors: vendors.length,
      totalRSVPs: rsvps.length,
      totalSoftOpening: softOpening.length,
      uniqueCities: uniqueCities.size,
      totalTickets: totalTickets,
      conversionRate: data.length > 0 ? 
        Math.round((rsvps.length / data.length) * 100) : 0,
    }
  }, [getCityName])

  const getCityStats = useCallback((data: Submission[]): CityStats[] => {
    const cityMap = new Map<string, { vendors: number, rsvps: number, softOpening: number, tickets: number }>()
    
    data.forEach(s => {
      const city = getCityName(s.data)
      if (!cityMap.has(city)) {
        cityMap.set(city, { vendors: 0, rsvps: 0, softOpening: 0, tickets: 0 })
      }
      const stats = cityMap.get(city)!
      if (s.type === 'vendor') {
        stats.vendors += 1
      } else if (s.type === 'rsvp') {
        if (s.data?.eventType === 'soft-opening') {
          stats.softOpening += 1
        } else {
          stats.rsvps += 1
        }
        if (s.data.tickets) {
          stats.tickets += parseInt(String(s.data.tickets)) || 0
        }
      }
    })

    return Array.from(cityMap.entries()).map(([name, stats]) => ({
      name,
      total: stats.vendors + stats.rsvps + stats.softOpening,
      vendors: stats.vendors,
      rsvps: stats.rsvps,
      softOpening: stats.softOpening,
      totalTickets: stats.tickets,
      capacity: cityCapacities[name],
      percentage: cityCapacities[name] ? 
        Math.round((stats.tickets / cityCapacities[name]) * 100) : 0,
    }))
  }, [getCityName])

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/data')
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Failed to fetch data', error)
    } finally {
      setLoading(false)
    }
  }, [router])

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

  const stats = calculateStats(submissions)
  const cityStats = getCityStats(submissions)
  
  const filteredCityStats = cityStats
    .filter(city => {
      if (filter === 'vendors') return city.vendors > 0
      if (filter === 'rsvps') return city.rsvps > 0
      if (filter === 'soft-opening') return city.softOpening > 0
      return true
    })
    .filter(city => 
      city.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const sortedCityStats = [...filteredCityStats].sort((a, b) => {
    let aVal = 0, bVal = 0
    if (sortBy === 'name') {
      aVal = a.name.localeCompare(b.name)
      bVal = 0
    } else if (sortBy === 'total') {
      aVal = a.total
      bVal = b.total
    } else if (sortBy === 'tickets') {
      aVal = a.totalTickets
      bVal = b.totalTickets
    } else if (sortBy === 'percentage') {
      aVal = a.percentage || 0
      bVal = b.percentage || 0
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  const handleExport = () => {
    const headers = ['City', 'Total', 'Vendors', 'RSVPs', 'Soft Opening', 'Tickets Sold', 'Capacity', 'Fill Rate']
    const rows = sortedCityStats.map(city => [
      city.name,
      city.total,
      city.vendors,
      city.rsvps,
      city.softOpening,
      city.totalTickets,
      city.capacity || 'Unlimited',
      city.percentage ? `${city.percentage}%` : 'N/A',
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statistics-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const getFillColor = (percentage: number | undefined) => {
    if (percentage === undefined) return 'bg-rosewood/10'
    if (percentage > 70) return 'bg-chartreuse'
    if (percentage > 40) return 'bg-hippie'
    if (percentage > 20) return 'bg-henna'
    return 'bg-poppy'
  }

  const getProgressColor = (percentage: number | undefined) => {
    if (percentage === undefined) return 'bg-rosewood/10'
    if (percentage > 70) return 'text-chartreuse'
    if (percentage > 40) return 'text-hippie'
    if (percentage > 20) return 'text-henna'
    return 'text-poppy'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading statistics...</div>
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
              Statistics
            </h1>
            <p className="font-host-grotesk text-rosewood/50">
              {stats.totalSubmissions} total submissions • {stats.totalTickets} tickets sold
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-chartreuse/10 p-2 rounded-lg">
                <Users className="w-5 h-5 text-chartreuse" />
              </div>
              <div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.totalSubmissions}</p>
                <p className="font-host-grotesk text-sm text-rosewood/40">Total Submissions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-henna/10 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-henna" />
              </div>
              <div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.totalVendors}</p>
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
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.totalTickets}</p>
                <p className="font-host-grotesk text-sm text-rosewood/40">Tickets Sold</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-olive/10 p-2 rounded-lg">
                <PartyPopper className="w-5 h-5 text-olive" />
              </div>
              <div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.totalSoftOpening}</p>
                <p className="font-host-grotesk text-sm text-rosewood/40">Soft Opening</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">Unique Cities</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.uniqueCities}</p>
            </div>
            <div className="bg-chartreuse/10 p-2 rounded-lg">
              <MapPin className="w-5 h-5 text-chartreuse" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">Conversion Rate</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">{stats.conversionRate}%</p>
            </div>
            <div className="bg-chartreuse/10 p-2 rounded-lg">
              <Percent className="w-5 h-5 text-chartreuse" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">Avg Tickets Per RSVP</p>
              <p className="font-host-grotesk text-2xl font-bold text-rosewood">
                {stats.totalRSVPs > 0 ? (stats.totalTickets / stats.totalRSVPs).toFixed(1) : '0'}
              </p>
            </div>
            <div className="bg-cypress/10 p-2 rounded-lg">
              <TrendingUpIcon className="w-5 h-5 text-cypress" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all ${
                filter === 'all' ? 'bg-rosewood text-plaster' : 'bg-white text-rosewood/60 hover:bg-white/80'
              }`}
            >
              All Cities
            </button>
            <button
              onClick={() => setFilter('vendors')}
              className={`px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all ${
                filter === 'vendors' ? 'bg-rosewood text-plaster' : 'bg-white text-rosewood/60 hover:bg-white/80'
              }`}
            >
              Vendors Only
            </button>
            <button
              onClick={() => setFilter('rsvps')}
              className={`px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all ${
                filter === 'rsvps' ? 'bg-rosewood text-plaster' : 'bg-white text-rosewood/60 hover:bg-white/80'
              }`}
            >
              RSVPs Only
            </button>
            <button
              onClick={() => setFilter('soft-opening')}
              className={`px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all ${
                filter === 'soft-opening' ? 'bg-chartreuse text-grove' : 'bg-white text-rosewood/60 hover:bg-white/80'
              }`}
            >
              🎉 Soft Opening
            </button>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <input
              type="text"
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'total' | 'tickets' | 'percentage')}
              className="px-3 py-2 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
            >
              <option value="tickets">Sort by Tickets</option>
              <option value="percentage">Sort by Fill Rate</option>
              <option value="total">Sort by Total</option>
              <option value="name">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood flex items-center gap-1 hover:bg-white/80 transition-all"
            >
              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* City Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCityStats.map((city) => {
            const isSelected = selectedCity === city.name
            const fillColor = getFillColor(city.percentage)
            const progressColor = getProgressColor(city.percentage)

            return (
              <div
                key={city.name}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all cursor-pointer hover:shadow-md ${
                  isSelected ? 'border-chartreuse ring-2 ring-chartreuse/20' : 'border-rosewood/5'
                }`}
                onClick={() => setSelectedCity(isSelected ? null : city.name)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-host-grotesk font-bold text-lg text-rosewood">{city.name}</h3>
                    <p className="font-host-grotesk text-xs text-rosewood/40">
                      {city.vendors} vendors · {city.rsvps} RSVPs · {city.softOpening} soft opening
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-host-grotesk text-2xl font-bold text-rosewood">{city.totalTickets}</span>
                    {city.capacity && (
                      <span className="font-host-grotesk text-xs text-rosewood/30">/{city.capacity}</span>
                    )}
                  </div>
                </div>

                {/* Progress Bar - Based on Tickets */}
                {city.capacity ? (
                  <div className="relative mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-host-grotesk text-xs text-rosewood/40">Tickets sold</span>
                      <span className={`font-host-grotesk text-xs font-semibold ${progressColor}`}>
                        {city.percentage || 0}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-rosewood/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${fillColor}`}
                        style={{ width: `${Math.min(city.percentage || 0, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-host-grotesk text-xs text-rosewood/40">
                        {city.totalTickets} sold
                      </span>
                      <span className="font-host-grotesk text-xs text-rosewood/40">
                        {city.capacity - city.totalTickets} remaining
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-2 bg-rosewood/5 rounded-lg text-center">
                    <span className="font-host-grotesk text-xs text-rosewood/40">Unlimited capacity</span>
                    <p className="font-host-grotesk font-bold text-rosewood text-lg">{city.totalTickets} tickets sold</p>
                  </div>
                )}

                {/* Stats Breakdown */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-rosewood/5">
                  <div className="text-center">
                    <p className="font-host-grotesk text-xs text-rosewood/40">Total</p>
                    <p className="font-host-grotesk font-bold text-rosewood">{city.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-host-grotesk text-xs text-rosewood/40">Vendors</p>
                    <p className="font-host-grotesk font-bold text-rosewood">{city.vendors}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-host-grotesk text-xs text-rosewood/40">RSVPs</p>
                    <p className="font-host-grotesk font-bold text-rosewood">{city.rsvps}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-host-grotesk text-xs text-rosewood/40">Soft Open</p>
                    <p className="font-host-grotesk font-bold text-rosewood">{city.softOpening}</p>
                  </div>
                </div>

                {/* Ticket count highlight */}
                <div className="mt-3 pt-3 border-t border-rosewood/5 flex items-center justify-between">
                  <span className="font-host-grotesk text-xs text-rosewood/40">🎟️ Tickets</span>
                  <span className="font-host-grotesk font-bold text-rosewood text-lg">{city.totalTickets}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {sortedCityStats.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/50 rounded-2xl p-12 border border-rosewood/5">
              <BarChart3 className="w-16 h-16 text-rosewood/20 mx-auto mb-4" />
              <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">No data available</h3>
              <p className="font-host-grotesk text-rosewood/40 mt-2">Start collecting submissions to see statistics here.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center font-host-grotesk text-xs text-rosewood/20">
          {sortedCityStats.length} cities shown • {stats.totalTickets} total tickets sold
        </div>
      </div>
    </div>
  )
}