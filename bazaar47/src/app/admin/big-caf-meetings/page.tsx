// app/admin/big-caf-meetings/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  CalendarDays, Users, Search, X, RefreshCw, Download,
  Trash2, CheckCircle2, Circle, Loader2,
  Mail, Phone, ChevronDown, ChevronUp, Clock
} from 'lucide-react'
import type {
  BigCafMeetingResponse,
  BigCafAvailabilityEntry,
} from '@/types/big-caf-meetings'
import { formatDayLong, formatDayShort } from '@/lib/big-caf-meetings/dates'
import { MEETING_TIME_WINDOW_START, MEETING_TIME_WINDOW_END } from '@/data/big-caf-meetings'
import {
  buildBigCafMeetingsCsv,
  downloadCsv,
} from '@/lib/big-caf-meetings/csv'

// ============================================
// TYPES
// ============================================

type Tab = 'person' | 'day'

interface DayBucketEntry {
  person: BigCafMeetingResponse
  timeWindow: string
}

interface DayBucket {
  iso: string
  entries: DayBucketEntry[]
}

// ============================================
// HELPERS
// ============================================

/** "4 PM" → "4 PM", "" → "anytime", "  5-7  " → "5-7" */
function displayTime(timeWindow: string): string {
  const trimmed = timeWindow.trim()
  return trimmed === '' ? 'anytime' : trimmed
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminBigCafMeetingsPage() {
  const [responses, setResponses] = useState<BigCafMeetingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('person')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchResponses = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null)
    try {
      const res = await fetch('/api/big-caf-meetings')
      if (!res.ok) {
        if (!opts?.silent) setError('Failed to load responses')
        return
      }
      const data = await res.json()
      setResponses(data.responses || [])
    } catch (err) {
      console.error('Fetch error:', err)
      if (!opts?.silent) setError('Network error — please try again')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchResponses()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchResponses])

  const filteredResponses = useMemo(() => {
    if (!searchTerm.trim()) return responses
    const s = searchTerm.toLowerCase()
    return responses.filter(
      (r) =>
        r.fullName.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.phone.toLowerCase().includes(s)
    )
  }, [responses, searchTerm])

  // Group by day (per-day time is now attached to each entry)
  const dayBuckets: DayBucket[] = useMemo(() => {
    const map = new Map<string, DayBucketEntry[]>()
    for (const r of filteredResponses) {
      for (const entry of r.availability) {
        if (!map.has(entry.date)) map.set(entry.date, [])
        map.get(entry.date)!.push({ person: r, timeWindow: entry.timeWindow })
      }
    }
    const buckets: DayBucket[] = Array.from(map.entries()).map(
      ([iso, entries]) => ({
        iso,
        entries: entries.sort((a, b) =>
          a.person.fullName.localeCompare(b.person.fullName)
        ),
      })
    )
    buckets.sort((a, b) => a.iso.localeCompare(b.iso))
    return buckets
  }, [filteredResponses])

  // ---------------- Handlers ----------------

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}'s response? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/big-caf-meetings/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchResponses({ silent: true })
      } else {
        alert('Failed to delete response')
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete response')
    }
  }

  const handleToggleConfirmed = async (id: string, nextConfirmed: boolean) => {
    setResponses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, confirmed: nextConfirmed } : r))
    )
    try {
      const res = await fetch(`/api/big-caf-meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: nextConfirmed }),
      })
      if (!res.ok) {
        setResponses((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, confirmed: !nextConfirmed } : r
          )
        )
        alert('Failed to update')
      }
    } catch (err) {
      console.error('Toggle error:', err)
      setResponses((prev) =>
        prev.map((r) => (r.id === id ? { ...r, confirmed: !nextConfirmed } : r))
      )
    }
  }

  const handleSaveNote = async (id: string, note: string) => {
    const previous = responses.find((r) => r.id === id)?.confirmedNote
    setResponses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, confirmedNote: note } : r))
    )
    try {
      const res = await fetch(`/api/big-caf-meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmedNote: note }),
      })
      if (!res.ok) {
        setResponses((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, confirmedNote: previous } : r
          )
        )
        alert('Failed to save note')
      }
    } catch (err) {
      console.error('Note save error:', err)
    }
  }

  const handleExportCsv = () => {
    if (filteredResponses.length === 0) return
    const csv = buildBigCafMeetingsCsv(filteredResponses)
    const filename = `big-caf-meetings-${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(filename, csv)
  }

  // ---------------- States ----------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading responses...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-plaster p-4">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">⚠️ Error</div>
        <div className="text-rosewood/60 font-host-grotesk">{error}</div>
        <button
          onClick={() => fetchResponses()}
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const totalDays = dayBuckets.length
  const totalConfirmed = responses.filter((r) => r.confirmed).length

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-rosewood/60" />
              Big Caf Meetings
            </h1>
            <p className="font-host-grotesk text-rosewood/50 mt-1">
              {responses.length} response{responses.length === 1 ? '' : 's'}
              {' · '}
              {totalDays} day{totalDays === 1 ? '' : 's'} with availability
              {' · '}
              {totalConfirmed} confirmed
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchResponses()}
              className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExportCsv}
              disabled={filteredResponses.length === 0}
              title={filteredResponses.length === 0 ? 'No responses to export' : 'Export to CSV'}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex bg-white rounded-xl p-1 border border-rosewood/10 shadow-sm">
            <button
              onClick={() => setTab('person')}
              className={`px-4 py-2 rounded-lg font-host-grotesk font-semibold text-sm transition-all flex items-center gap-2 ${
                tab === 'person'
                  ? 'bg-rosewood text-plaster'
                  : 'text-rosewood/60 hover:text-rosewood'
              }`}
            >
              <Users className="w-4 h-4" />
              By Person
            </button>
            <button
              onClick={() => setTab('day')}
              className={`px-4 py-2 rounded-lg font-host-grotesk font-semibold text-sm transition-all flex items-center gap-2 ${
                tab === 'day'
                  ? 'bg-rosewood text-plaster'
                  : 'text-rosewood/60 hover:text-rosewood'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              By Day
            </button>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rosewood/30" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
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

          {searchTerm && (
            <span className="font-host-grotesk text-sm text-rosewood/50">
              {filteredResponses.length} of {responses.length} shown
            </span>
          )}
        </div>

        {/* Empty states */}
        {responses.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
            <CalendarDays className="w-16 h-16 text-rosewood/20 mx-auto mb-4" />
            <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">
              No responses yet
            </h3>
            <p className="font-host-grotesk text-rosewood/50 mt-2">
              Share the link with your team and vendors, and their availability
              will show up here.
            </p>
          </div>
        )}

        {responses.length > 0 && filteredResponses.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
            <Search className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
            <p className="font-host-grotesk text-rosewood/50">
              No responses match your search.
            </p>
          </div>
        )}

        {/* Tab: By Person */}
        {tab === 'person' && filteredResponses.length > 0 && (
          <PersonTable
            responses={filteredResponses}
            onDelete={handleDelete}
            onToggleConfirmed={handleToggleConfirmed}
            onSaveNote={handleSaveNote}
          />
        )}

        {/* Tab: By Day */}
        {tab === 'day' && dayBuckets.length > 0 && (
          <DayTable buckets={dayBuckets} />
        )}
      </div>
    </div>
  )
}

// ============================================
// PERSON TABLE
// ============================================

interface PersonTableProps {
  responses: BigCafMeetingResponse[]
  onDelete: (id: string, name: string) => void
  onToggleConfirmed: (id: string, next: boolean) => void
  onSaveNote: (id: string, note: string) => void
}

function PersonTable({
  responses,
  onDelete,
  onToggleConfirmed,
  onSaveNote,
}: PersonTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-plaster/40">
            <tr>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Name</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Contact</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Days</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Confirmed</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Note</th>
              <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Actions</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id} className="border-t border-rosewood/5 hover:bg-plaster/20 transition-colors">
                <td className="px-4 py-3 align-top">
                  <p className="font-host-grotesk font-semibold text-rosewood">{r.fullName}</p>
                  <p className="font-host-grotesk text-xs text-rosewood/40 mt-0.5">
                    Submitted {new Date(r.timestamp).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-1.5 text-xs text-rosewood/60">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{r.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-rosewood/60 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{r.phone}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <button
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="flex items-center gap-1.5 font-host-grotesk text-sm font-semibold text-rosewood hover:text-poppy transition-colors"
                  >
                    {r.availability.length} day{r.availability.length === 1 ? '' : 's'}
                    {expandedId === r.id ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {expandedId === r.id && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-xs">
                      {r.availability.map((entry) => (
                        <span
                          key={entry.date}
                          className="bg-chartreuse/15 text-cypress font-host-grotesk text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                        >
                          {formatDayShort(entry.date)}
                          {entry.timeWindow.trim() !== '' && (
                            <>
                              <span className="opacity-40">·</span>
                              <span>{entry.timeWindow.trim()}</span>
                            </>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <button
                    onClick={() => onToggleConfirmed(r.id, !r.confirmed)}
                    className={`flex items-center gap-1.5 font-host-grotesk text-sm font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                      r.confirmed
                        ? 'bg-chartreuse/20 text-cypress hover:bg-chartreuse/30'
                        : 'bg-rosewood/5 text-rosewood/50 hover:bg-rosewood/10'
                    }`}
                  >
                    {r.confirmed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                    {r.confirmed ? 'Confirmed' : 'Pending'}
                  </button>
                </td>
                <td className="px-4 py-3 align-top">
                  <NoteInput
                    initialValue={r.confirmedNote || ''}
                    onSave={(note) => onSaveNote(r.id, note)}
                  />
                </td>
                <td className="px-4 py-3 align-top text-right">
                  <button
                    onClick={() => onDelete(r.id, r.fullName)}
                    className="text-rosewood/30 hover:text-poppy transition-colors p-1"
                    title="Delete response"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
// NOTE INPUT
// ============================================

function NoteInput({
  initialValue,
  onSave,
}: {
  initialValue: string
  onSave: (note: string) => void
}) {
  const [value, setValue] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(initialValue)

  const handleBlur = async () => {
    if (value === lastSaved) return
    setIsSaving(true)
    await onSave(value)
    setLastSaved(value)
    setIsSaving(false)
  }

  return (
    <div className="relative max-w-xs">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add a note..."
        className="w-full px-3 py-1.5 bg-plaster/40 border border-rosewood/10 rounded-lg font-host-grotesk text-sm text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:bg-white transition-all"
      />
      {isSaving && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-rosewood/40 absolute right-2 top-1/2 -translate-y-1/2" />
      )}
    </div>
  )
}

// ============================================
// DAY TABLE
// ============================================

function DayTable({ buckets }: { buckets: DayBucket[] }) {
  return (
    <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-plaster/40">
            <tr>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50 w-56">Day</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50 w-32">Available</th>
              <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">People</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map(({ iso, entries }) => (
              <tr key={iso} className="border-t border-rosewood/5 hover:bg-plaster/20 transition-colors">
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-rosewood/40 shrink-0" />
                    <p className="font-host-grotesk font-semibold text-sm text-rosewood">
                      {formatDayLong(iso)}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className="inline-flex items-center gap-1.5 bg-chartreuse/15 text-cypress font-host-grotesk text-sm font-semibold px-2.5 py-1 rounded-full">
                    <Users className="w-3.5 h-3.5" />
                    {entries.length}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap gap-1.5">
                    {entries.map(({ person, timeWindow }) => {
                      const time = timeWindow.trim()
                      return (
                        <span
                          key={person.id}
                          className={`inline-flex items-center gap-1 font-host-grotesk text-xs font-semibold px-2.5 py-1 rounded-full ${
                            person.confirmed
                              ? 'bg-grove/10 text-grove'
                              : 'bg-plaster text-rosewood/70'
                          }`}
                        >
                          {person.confirmed && <CheckCircle2 className="w-3 h-3" />}
                          <span>{person.fullName}</span>
                          {time !== '' && (
                            <>
                              <span className="opacity-40">·</span>
                              <span className="opacity-75 inline-flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {time}
                              </span>
                            </>
                          )}
                        </span>
                      )
                    })}
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