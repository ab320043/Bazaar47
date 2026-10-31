// app/admin/staff-dashboard/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Users,
  RefreshCw,
  Clock,
  DollarSign,
  Zap,
  Search,
  X,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { NeedsReviewTab } from './NeedsReviewTab'

// ============================================
// TYPES
// ============================================

interface StaffHoursRow {
  assignmentId: string
  eventId: string
  eventName: string
  staffId: string
  staffName: string
  roles: string[]
  status: string
  shiftStart: string
  shiftEnd: string
  checkInTime?: string
  checkOutTime?: string
  hoursWorked?: number
  hourlyRate: number
  amountOwed: number
  isCurrentlyClockedIn: boolean
}

interface ApiResponse {
  rows: StaffHoursRow[]
  summary: {
    total: number
    currentlyClockedIn: number
    totalHours: number
    totalOwed: number
  }
  currentlyClockedIn: StaffHoursRow[]
}

type RangePreset = 'today' | 'this-week' | 'this-month' | 'all'
type Tab = 'activity' | 'needs-review'

// ============================================
// HELPERS
// ============================================

function toIsoLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getRangeDates(preset: RangePreset): { from?: string; to?: string } {
  const now = new Date()
  const todayIso = toIsoLocal(now)

  if (preset === 'today') {
    return { from: todayIso, to: todayIso }
  }
  if (preset === 'this-week') {
    const dow = now.getDay()
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { from: toIsoLocal(monday), to: toIsoLocal(sunday) }
  }
  if (preset === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from: toIsoLocal(start), to: toIsoLocal(end) }
  }
  return {}
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminStaffDashboardPage() {
  const [tab, setTab] = useState<Tab>('activity')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<RangePreset>('this-month')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(0)

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null)
    try {
      const { from, to } = getRangeDates(range)
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      const res = await fetch(`/api/admin/staff/hours?${params.toString()}`)
      if (!res.ok) {
        if (!opts?.silent) setError('Failed to load hours data')
        return
      }
      const body = (await res.json()) as ApiResponse
      setData(body)
    } catch (err) {
      console.error('Hours fetch error:', err)
      if (!opts?.silent) setError('Network error — please try again')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [range])

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/worklogs?filter=needs-review')
      if (res.ok) {
        const body = await res.json()
        setPendingReviewCount(body.count || 0)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData()
      void fetchPendingCount()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchData, fetchPendingCount])

  const handleUpdateHours = async (
    assignmentId: string,
    hoursWorked: number
  ) => {
    setActionId(assignmentId)
    try {
      const res = await fetch(
        `/api/admin/staff/assignments/${assignmentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hoursWorked }),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Failed to update hours')
        return
      }
      await fetchData({ silent: true })
    } catch {
      alert('Network error while updating hours')
    } finally {
      setActionId(null)
    }
  }

  const handleUpdateRate = async (assignmentId: string, hourlyRate: number) => {
    setActionId(assignmentId)
    try {
      const res = await fetch(
        `/api/admin/staff/assignments/${assignmentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hourlyRate }),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Failed to update rate')
        return
      }
      await fetchData({ silent: true })
    } catch {
      alert('Network error while updating rate')
    } finally {
      setActionId(null)
    }
  }

  const filteredRows = useMemo(() => {
    if (!data) return []
    if (!searchTerm.trim()) return data.rows
    const s = searchTerm.toLowerCase()
    return data.rows.filter(
      (r) =>
        r.staffName.toLowerCase().includes(s) ||
        r.eventName.toLowerCase().includes(s)
    )
  }, [data, searchTerm])

  const handleExportCsv = () => {
    if (!data || filteredRows.length === 0) return

    const headers = [
      'Staff Name',
      'Event',
      'Roles',
      'Shift Start',
      'Shift End',
      'Check In',
      'Check Out',
      'Hours',
      'Rate',
      'Amount Owed',
      'Status',
    ]

    const rows = filteredRows.map((r) => [
      r.staffName,
      r.eventName,
      r.roles.join('; '),
      r.shiftStart,
      r.shiftEnd,
      r.checkInTime || '',
      r.checkOutTime || '',
      r.hoursWorked !== undefined ? r.hoursWorked.toFixed(2) : '0',
      r.hourlyRate.toFixed(2),
      r.amountOwed.toFixed(2),
      r.status,
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `staff-hours-${toIsoLocal(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---- LOADING ----

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">
          Loading staff hours...
        </div>
      </div>
    )
  }

  // ---- ERROR ----

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-plaster p-4">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">
          ⚠️ Error
        </div>
        <div className="text-rosewood/60 font-host-grotesk">
          {error || 'No data available'}
        </div>
        <button
          onClick={() => fetchData()}
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood flex items-center gap-3">
              <Clock className="w-8 h-8 text-rosewood/60" />
              Staff Hours & Activity
            </h1>
            <p className="font-host-grotesk text-rosewood/50 mt-1">
              {data.summary.total} shifts ·{' '}
              {data.summary.currentlyClockedIn} clocked in now
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchData()}
              className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {tab === 'activity' && (
              <button
                onClick={handleExportCsv}
                disabled={filteredRows.length === 0}
                className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-rosewood/10 mb-6">
          <button
            onClick={() => setTab('activity')}
            className={`px-4 py-2 font-host-grotesk font-semibold text-sm transition-all flex items-center gap-1.5 ${
              tab === 'activity'
                ? 'text-rosewood border-b-2 border-rosewood'
                : 'text-rosewood/40 hover:text-rosewood/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Activity
          </button>
          <button
            onClick={() => {
              setTab('needs-review')
              void fetchPendingCount()
            }}
            className={`px-4 py-2 font-host-grotesk font-semibold text-sm transition-all flex items-center gap-1.5 ${
              tab === 'needs-review'
                ? 'text-rosewood border-b-2 border-rosewood'
                : 'text-rosewood/40 hover:text-rosewood/60'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Needs review
            {pendingReviewCount > 0 && (
              <span className="bg-poppy text-plaster text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingReviewCount}
              </span>
            )}
          </button>
        </div>

        {/* Activity tab */}
        {tab === 'activity' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-rosewood/40" />
                  <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
                    Total Shifts
                  </p>
                </div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">
                  {data.summary.total}
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-chartreuse/30 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-chartreuse" />
                  <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
                    Clocked In Now
                  </p>
                </div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">
                  {data.summary.currentlyClockedIn}
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-rosewood/40" />
                  <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
                    Total Hours
                  </p>
                </div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">
                  {data.summary.totalHours}h
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-rosewood/40" />
                  <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
                    Total Owed
                  </p>
                </div>
                <p className="font-host-grotesk text-2xl font-bold text-rosewood">
                  {formatCurrency(data.summary.totalOwed)}
                </p>
              </div>
            </div>

            {/* Currently clocked in banner */}
            {data.currentlyClockedIn.length > 0 && (
              <div className="bg-chartreuse/10 border-2 border-chartreuse/30 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-chartreuse animate-pulse" />
                  <h3 className="font-host-grotesk font-bold text-sm text-cypress uppercase tracking-wider">
                    Currently Working ({data.currentlyClockedIn.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.currentlyClockedIn.map((r) => (
                    <div
                      key={r.assignmentId}
                      className="bg-white rounded-lg px-3 py-2 border border-chartreuse/30"
                    >
                      <p className="font-host-grotesk font-semibold text-sm text-rosewood">
                        {r.staffName}
                      </p>
                      <p className="font-host-grotesk text-xs text-rosewood/50">
                        {r.eventName} · since {formatTime(r.checkInTime)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex bg-white rounded-xl p-1 border border-rosewood/10 shadow-sm">
                {(
                  [
                    ['today', 'Today'],
                    ['this-week', 'This Week'],
                    ['this-month', 'This Month'],
                    ['all', 'All Time'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setRange(key)}
                    className={`px-3 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-all ${
                      range === key
                        ? 'bg-rosewood text-plaster'
                        : 'text-rosewood/60 hover:text-rosewood'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rosewood/30" />
                  <input
                    type="text"
                    placeholder="Search by staff or event..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-rosewood/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-sm text-rosewood"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-rosewood/30 hover:text-rosewood transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <span className="font-host-grotesk text-sm text-rosewood/50">
                {filteredRows.length} of {data.rows.length} shown
              </span>
            </div>

            {/* Table */}
            {filteredRows.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
                <AlertCircle className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
                <p className="font-host-grotesk text-rosewood/50">
                  {data.rows.length === 0
                    ? 'No shifts in this date range.'
                    : 'No shifts match your search.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-plaster/40">
                      <tr>
                        <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Staff
                        </th>
                        <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Event
                        </th>
                        <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Shift
                        </th>
                        <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Check In / Out
                        </th>
                        <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Hours
                        </th>
                        <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Rate
                        </th>
                        <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Owed
                        </th>
                        <th className="text-center px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((r) => (
                        <tr
                          key={r.assignmentId}
                          className={`border-t border-rosewood/5 hover:bg-plaster/20 transition-colors ${
                            r.isCurrentlyClockedIn ? 'bg-chartreuse/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3 align-top">
                            <p className="font-host-grotesk font-semibold text-rosewood text-sm">
                              {r.staffName}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <Link
                              href={`/admin/events/${r.eventId}/staff`}
                              className="font-host-grotesk text-sm text-rosewood hover:text-chartreuse transition-colors"
                            >
                              {r.eventName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 align-top font-host-grotesk text-xs text-rosewood/60 whitespace-nowrap">
                            {formatDate(r.shiftStart)}
                            <br />
                            {formatTime(r.shiftStart)} – {formatTime(r.shiftEnd)}
                          </td>
                          <td className="px-4 py-3 align-top font-host-grotesk text-xs text-rosewood/60 whitespace-nowrap">
                            {formatTime(r.checkInTime)}
                            <br />
                            {formatTime(r.checkOutTime)}
                          </td>
                          <td className="px-4 py-3 align-top text-right">
                            <InlineNumberEdit
                              value={r.hoursWorked}
                              onSave={(v) =>
                                handleUpdateHours(r.assignmentId, v)
                              }
                              isSaving={actionId === r.assignmentId}
                              step={0.25}
                              suffix="h"
                            />
                          </td>
                          <td className="px-4 py-3 align-top text-right">
                            <InlineNumberEdit
                              value={r.hourlyRate}
                              onSave={(v) =>
                                handleUpdateRate(r.assignmentId, v)
                              }
                              isSaving={actionId === r.assignmentId}
                              step={0.5}
                              prefix="$"
                              suffix="/hr"
                            />
                          </td>
                          <td className="px-4 py-3 align-top text-right font-host-grotesk font-semibold text-rosewood text-sm whitespace-nowrap">
                            {formatCurrency(r.amountOwed)}
                          </td>
                          <td className="px-4 py-3 align-top text-center">
                            {r.isCurrentlyClockedIn ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-chartreuse text-grove">
                                <span className="w-1.5 h-1.5 rounded-full bg-grove animate-pulse" />
                                On Shift
                              </span>
                            ) : r.status === 'completed' ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-grove/10 text-grove">
                                Completed
                              </span>
                            ) : r.status === 'cancelled' ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-poppy/10 text-poppy">
                                Cancelled
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosewood/10 text-rosewood/60">
                                {r.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Needs review tab */}
        {tab === 'needs-review' && (
          <NeedsReviewTab />
        )}
      </div>
    </div>
  )
}

// ============================================
// INLINE NUMBER EDIT
// ============================================

function InlineNumberEdit({
  value,
  onSave,
  isSaving,
  step,
  prefix,
  suffix,
}: {
  value: number | undefined
  onSave: (n: number) => void
  isSaving: boolean
  step: number
  prefix?: string
  suffix?: string
}) {
  const [local, setLocal] = useState(
    value !== undefined ? String(value) : ''
  )
  const [lastSaved, setLastSaved] = useState(value)

  if (value !== lastSaved) {
    setLocal(value !== undefined ? String(value) : '')
    setLastSaved(value)
  }

  const handleBlur = () => {
    if (local === '') {
      setLocal(lastSaved !== undefined ? String(lastSaved) : '')
      return
    }
    const parsed = parseFloat(local)
    if (Number.isNaN(parsed) || parsed < 0) {
      setLocal(lastSaved !== undefined ? String(lastSaved) : '')
      return
    }
    if (parsed === lastSaved) return
    onSave(parsed)
    setLastSaved(parsed)
  }

  return (
    <div className="inline-flex items-center gap-0.5">
      {prefix && (
        <span className="font-host-grotesk text-xs text-rosewood/40">
          {prefix}
        </span>
      )}
      <input
        type="number"
        min="0"
        step={step}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        disabled={isSaving}
        className="w-16 px-1 py-0.5 text-xs text-right bg-transparent hover:bg-plaster/40 focus:bg-white border border-transparent focus:border-rosewood/20 rounded font-host-grotesk text-rosewood focus:outline-none focus:ring-1 focus:ring-chartreuse/40 disabled:opacity-50"
      />
      {suffix && (
        <span className="font-host-grotesk text-xs text-rosewood/40">
          {suffix}
        </span>
      )}
    </div>
  )
}