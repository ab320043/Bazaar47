// app/admin/open-mic/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import type { OpenMicSubmission, OpenMicSession } from '@/types/open-mic'
import {
  formatSessionLong,
  formatSessionShort,
  getNextWednesdays,
  shiftWeeks,
  todayIsoLocal,
} from '@/lib/open-mic/dates'
import { LineupBuilder } from './LineupBuilder'

// ============================================
// TYPES
// ============================================

interface OpenMicApiResponse {
  pool: OpenMicSubmission[]
  sessions: OpenMicSession[]
}

// ============================================
// COMPONENT
// ============================================

export default function AdminOpenMicPage() {
  const [pool, setPool] = useState<OpenMicSubmission[]>([])
  const [sessions, setSessions] = useState<OpenMicSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSessionDate, setActiveSessionDate] = useState<string | null>(
    null
  )

  // Wednesday picker state — where the "week starting" arrow is
  const [pickerAnchorIso, setPickerAnchorIso] = useState<string>(() =>
    todayIsoLocal()
  )
  const [isCreating, setIsCreating] = useState(false)

  // ---- Fetch ----

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/open-mic')
      const data: OpenMicApiResponse = await res.json()
      setPool(data.pool || [])
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Failed to load open mic data', err)
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchData])

  // ---- Wednesday chips for the picker ----

  const upcomingWednesdays = useMemo(
    () => getNextWednesdays(pickerAnchorIso, 8),
    [pickerAnchorIso]
  )

  const handlePickWednesday = (iso: string) => {
    setIsCreating(false)
    setActiveSessionDate(iso)
  }

  const handleShiftWeeks = (direction: -1 | 1) => {
    setPickerAnchorIso((prev) => shiftWeeks(prev, direction))
  }

  // ---- Session dates already on the board ----

  const existingSessionDates = useMemo(
    () => new Set(sessions.map((s) => s.date)),
    [sessions]
  )

  // ---- Render: builder view ----

  if (activeSessionDate) {
    const session =
      sessions.find((s) => s.date === activeSessionDate) || null

    // Filter out artists already in this session's lineup from the pool
    const availablePool = pool.filter(
      (p) => !session?.lineup.some((l) => l.submissionId === p.id)
    )

    return (
      <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <LineupBuilder
            sessionDate={activeSessionDate}
            initialSession={session}
            pool={availablePool}
            onBack={() => {
              setActiveSessionDate(null)
              void fetchData()
            }}
          />
        </div>
      </div>
    )
  }

  // ---- Render: loading ----

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <Loader2 className="w-8 h-8 animate-spin text-rosewood/40" />
      </div>
    )
  }

  // ---- Render: main view ----

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
              Open Mic
            </h1>
            <p className="text-rosewood/50 text-sm mt-1">
              Manage artist submissions and build lineups.
            </p>
          </div>
          <button
            onClick={() => setIsCreating((v) => !v)}
            className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Session
          </button>
        </div>

        {/* Wednesday picker panel */}
        {isCreating && (
          <div className="bg-white p-5 rounded-2xl border border-chartreuse shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                  Pick a Wednesday
                </h3>
                <p className="text-xs text-rosewood/50 mt-0.5">
                  Open Mic happens every Wednesday. Only Wednesdays are
                  selectable.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-rosewood/50 hover:text-rosewood transition-colors text-sm px-2"
              >
                Cancel
              </button>
            </div>

            {/* Prev / next week */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => handleShiftWeeks(-1)}
                className="p-2 rounded-full bg-plaster hover:bg-sand-dune/60 text-rosewood transition-colors"
                aria-label="Previous weeks"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-host-grotesk text-xs text-rosewood/50 px-2">
                {formatSessionShort(upcomingWednesdays[0] || pickerAnchorIso)}
                {' '}→{' '}
                {formatSessionShort(
                  upcomingWednesdays[upcomingWednesdays.length - 1] ||
                    pickerAnchorIso
                )}
              </span>
              <button
                onClick={() => handleShiftWeeks(1)}
                className="p-2 rounded-full bg-plaster hover:bg-sand-dune/60 text-rosewood transition-colors"
                aria-label="Next weeks"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Wednesday chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {upcomingWednesdays.map((iso) => {
                const alreadyExists = existingSessionDates.has(iso)
                return (
                  <button
                    key={iso}
                    onClick={() => handlePickWednesday(iso)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      alreadyExists
                        ? 'border-rosewood/10 bg-plaster/40 hover:border-rosewood/30'
                        : 'border-chartreuse/30 bg-chartreuse/5 hover:border-chartreuse hover:bg-chartreuse/10'
                    }`}
                  >
                    <p className="font-host-grotesk font-bold text-sm text-rosewood">
                      {formatSessionShort(iso)}
                    </p>
                    <p className="font-host-grotesk text-[11px] text-rosewood/50 mt-0.5">
                      {alreadyExists ? 'Open existing' : 'New session'}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sessions List */}
          <div className="space-y-3">
            <h2 className="font-host-grotesk font-bold text-xl text-rosewood">
              Scheduled Sessions
            </h2>
            {sessions.map((s) => (
              <button
                key={s.date}
                onClick={() => setActiveSessionDate(s.date)}
                className="w-full bg-white p-4 rounded-xl border border-rosewood/5 flex items-center justify-between hover:border-chartreuse text-left shadow-sm group transition-all"
              >
                <div>
                  <p className="font-bold text-rosewood">
                    {formatSessionLong(s.date)}
                  </p>
                  <p className="text-sm text-rosewood/50">
                    {s.lineup.length} artists scheduled
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-rosewood/30 group-hover:text-chartreuse transition-colors" />
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="text-sm text-rosewood/40 bg-white p-6 rounded-xl border border-rosewood/5 text-center">
                No sessions created yet.
              </p>
            )}
          </div>

          {/* Raw Pool */}
          <div className="space-y-3">
            <h2 className="font-host-grotesk font-bold text-xl text-rosewood">
              Artist Pool
            </h2>
            <div className="bg-white rounded-xl border border-rosewood/5 shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
              <div className="bg-plaster/30 p-3 text-sm text-rosewood/60 font-semibold border-b border-rosewood/5 flex justify-between">
                <span>Unassigned Submissions</span>
                <span className="bg-rosewood/10 text-rosewood/60 px-2 py-0.5 rounded-full text-xs">
                  {pool.length}
                </span>
              </div>
              <div className="overflow-y-auto p-4 space-y-2">
                {pool.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-plaster/20 rounded-lg border border-rosewood/5"
                  >
                    <p className="font-bold text-rosewood text-sm">
                      {sub.artistName}
                    </p>
                    <p className="text-xs text-rosewood/60">
                      {sub.genre} · {sub.email}
                    </p>
                    {sub.instagram && (
                      <p className="text-xs text-rosewood/40 mt-0.5">
                        {sub.instagram}
                      </p>
                    )}
                  </div>
                ))}
                {pool.length === 0 && (
                  <p className="text-center text-sm text-rosewood/40 py-8">
                    The pool is empty.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}