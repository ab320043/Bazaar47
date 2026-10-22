// app/admin/open-mic/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Pencil,
  Trash2,
  Calendar,
  Zap,
  Clock,
  FolderArchive,
} from 'lucide-react'
import type { OpenMicSubmission, OpenMicSession } from '@/types/open-mic'
import {
  formatSessionLong,
  formatSessionShort,
  getNextWednesdays,
  shiftWeeks,
  todayIsoLocal,
} from '@/lib/open-mic/dates'
import {
  classifySession,
  type SessionState,
} from '@/lib/open-mic/sessions-state'
import { LineupBuilder } from './LineupBuilder'
import { PoolEditModal } from './PoolEditModal'
import { DeletePoolConfirmModal } from './DeletePoolConfirmModal'
import { DeleteSessionConfirmModal } from './DeleteSessionConfirmModal'
import { ToastProvider, useToast } from './Toast'

// ============================================
// TYPES
// ============================================

interface OpenMicApiResponse {
  pool: OpenMicSubmission[]
  sessions: OpenMicSession[]
}

// ============================================
// PAGE (wraps the inner component in the toast provider)
// ============================================

export default function AdminOpenMicPage() {
  return (
    <ToastProvider>
      <AdminOpenMicInner />
    </ToastProvider>
  )
}

// ============================================
// INNER COMPONENT
// ============================================

function AdminOpenMicInner() {
  const { showToast } = useToast()

  const [pool, setPool] = useState<OpenMicSubmission[]>([])
  const [sessions, setSessions] = useState<OpenMicSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSessionDate, setActiveSessionDate] = useState<string | null>(
    null
  )

  // Wednesday picker
  const [pickerAnchorIso, setPickerAnchorIso] = useState<string>(() =>
    todayIsoLocal()
  )
  const [isCreating, setIsCreating] = useState(false)

  // Pool edit / delete modals
  const [editingSubmission, setEditingSubmission] =
    useState<OpenMicSubmission | null>(null)
  const [deletingSubmission, setDeletingSubmission] =
    useState<OpenMicSubmission | null>(null)

  // Session delete modal (only used for non-empty sessions)
  const [deletingSession, setDeletingSession] =
    useState<OpenMicSession | null>(null)

  // ---- Fetch ----

  const fetchData = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true)
      try {
        const res = await fetch('/api/admin/open-mic')
        const data: OpenMicApiResponse = await res.json()
        setPool(data.pool || [])
        setSessions(data.sessions || [])
      } catch (err) {
        console.error('Failed to load open mic data', err)
        if (!opts?.silent) {
          showToast({
            kind: 'error',
            title: 'Failed to load Open Mic data',
            message: 'Please refresh the page and try again.',
          })
        }
      } finally {
        if (!opts?.silent) setLoading(false)
      }
    },
    [showToast]
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchData])

  // ---- Wednesday chips ----

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

  const existingSessionDates = useMemo(
    () => new Set(sessions.map((s) => s.date)),
    [sessions]
  )

  // ---- Sessions grouped by state ----

  const groupedSessions = useMemo(() => {
    const current: OpenMicSession[] = []
    const upcoming: OpenMicSession[] = []
    const past: OpenMicSession[] = []

    for (const s of sessions) {
      const state = classifySession(s.date)
      if (state === 'current') current.push(s)
      else if (state === 'upcoming') upcoming.push(s)
      else past.push(s)
    }

    // Current: only 0 or 1 (today). Sort by date asc — trivial.
    current.sort((a, b) => a.date.localeCompare(b.date))
    // Upcoming: soonest first.
    upcoming.sort((a, b) => a.date.localeCompare(b.date))
    // Past: most recent first.
    past.sort((a, b) => b.date.localeCompare(a.date))

    return { current, upcoming, past }
  }, [sessions])

  // ---- Pool: edit ----

  const handleEditSaved = (updated: OpenMicSubmission) => {
    setPool((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    )
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        lineup: s.lineup.map((slot) =>
          slot.submissionId === updated.id
            ? { ...slot, artistName: updated.artistName }
            : slot
        ),
      }))
    )
    showToast({
      kind: 'success',
      title: 'Submission updated',
      message: `${updated.artistName} has been saved.`,
    })
  }

  // ---- Pool: delete ----

  const handleDeletePoolConfirmed = () => {
    if (!deletingSubmission) return
    const deletedId = deletingSubmission.id
    const deletedName = deletingSubmission.artistName

    setPool((prev) => prev.filter((s) => s.id !== deletedId))
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        lineup: s.lineup.filter((slot) => slot.submissionId !== deletedId),
      }))
    )

    showToast({
      kind: 'success',
      title: 'Submission deleted',
      message: `${deletedName} has been removed from the pool and any lineups.`,
    })
  }

  // ---- Session: delete flow ----
  //
  // Empty sessions (lineup.length === 0) delete silently.
  // Sessions with artists open the confirm modal.

  const handleDeleteSessionIntent = async (session: OpenMicSession) => {
    if (session.lineup.length === 0) {
      // Silent delete
      try {
        const res = await fetch(
          `/api/admin/open-mic/sessions/${session.date}`,
          { method: 'DELETE' }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          showToast({
            kind: 'error',
            title: 'Could not delete session',
            message: body.error || 'Please try again.',
          })
          return
        }
        setSessions((prev) => prev.filter((s) => s.date !== session.date))
        showToast({
          kind: 'success',
          title: 'Session removed',
          message: `${formatSessionLong(session.date)} cleared.`,
        })
      } catch {
        showToast({
          kind: 'error',
          title: 'Network error',
          message: 'Could not delete session.',
        })
      }
      return
    }

    // Confirm modal for non-empty
    setDeletingSession(session)
  }

  const handleDeleteSessionConfirmed = (dateIso: string) => {
    const removed = sessions.find((s) => s.date === dateIso)
    setSessions((prev) => prev.filter((s) => s.date !== dateIso))
    if (activeSessionDate === dateIso) {
      setActiveSessionDate(null)
    }
    showToast({
      kind: 'success',
      title: 'Session deleted',
      message: removed
        ? `${formatSessionLong(removed.date)} removed. Artists stay in the pool.`
        : 'Session removed.',
    })
  }

  // ---- Render: builder ----

  if (activeSessionDate) {
    const session =
      sessions.find((s) => s.date === activeSessionDate) || null

    const state = classifySession(activeSessionDate)

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
            sessionState={state}
            onBack={() => {
              setActiveSessionDate(null)
              void fetchData()
            }}
            onDeleteSession={() => {
              if (session) void handleDeleteSessionIntent(session)
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

  const totalSessions = sessions.length

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
              {totalSessions} session{totalSessions === 1 ? '' : 's'} ·{' '}
              {pool.length} artist{pool.length === 1 ? '' : 's'} in pool
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
          {/* Sessions grouped by state */}
          <div className="space-y-6">
            {/* CURRENT */}
            {groupedSessions.current.length > 0 && (
              <SessionGroup
                icon={<Zap className="w-4 h-4" />}
                title="Current"
                hint="Happening today"
                sessions={groupedSessions.current}
                onOpen={(iso) => setActiveSessionDate(iso)}
                onDelete={handleDeleteSessionIntent}
              />
            )}

            {/* UPCOMING */}
            <SessionGroup
              icon={<Clock className="w-4 h-4" />}
              title="Upcoming"
              hint={`${groupedSessions.upcoming.length} scheduled`}
              sessions={groupedSessions.upcoming}
              onOpen={(iso) => setActiveSessionDate(iso)}
              onDelete={handleDeleteSessionIntent}
              emptyMessage="No upcoming sessions."
            />

            {/* ARCHIVED */}
            {groupedSessions.past.length > 0 && (
              <ArchivedGroup
                sessions={groupedSessions.past}
                onOpen={(iso) => setActiveSessionDate(iso)}
                onDelete={handleDeleteSessionIntent}
              />
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
                  <PoolRow
                    key={sub.id}
                    submission={sub}
                    onEdit={() => setEditingSubmission(sub)}
                    onDelete={() => setDeletingSubmission(sub)}
                  />
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

      {/* Pool edit modal */}
      {editingSubmission && (
        <PoolEditModal
          submission={editingSubmission}
          onClose={() => setEditingSubmission(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Pool delete confirm modal */}
      {deletingSubmission && (
        <DeletePoolConfirmModal
          submission={deletingSubmission}
          sessions={sessions}
          onClose={() => setDeletingSubmission(null)}
          onDeleted={handleDeletePoolConfirmed}
        />
      )}

      {/* Session delete confirm modal (non-empty sessions only) */}
      {deletingSession && (
        <DeleteSessionConfirmModal
          session={deletingSession}
          sessionState={classifySession(deletingSession.date)}
          onClose={() => setDeletingSession(null)}
          onDeleted={handleDeleteSessionConfirmed}
        />
      )}
    </div>
  )
}

// ============================================
// SESSION GROUP
// ============================================

function SessionGroup({
  icon,
  title,
  hint,
  sessions,
  onOpen,
  onDelete,
  emptyMessage,
}: {
  icon: React.ReactNode
  title: string
  hint?: string
  sessions: OpenMicSession[]
  onOpen: (iso: string) => void
  onDelete: (session: OpenMicSession) => void
  emptyMessage?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-white border border-rosewood/10 flex items-center justify-center text-rosewood/60 shrink-0">
          {icon}
        </div>
        <h2 className="font-host-grotesk font-bold text-xl text-rosewood">
          {title}
        </h2>
        {hint && (
          <span className="font-host-grotesk text-xs text-rosewood/40">
            · {hint}
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-rosewood/40 bg-white p-4 rounded-xl border border-rosewood/5 text-center">
          {emptyMessage || 'Nothing here.'}
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <SessionRow
              key={s.date}
              session={s}
              onOpen={() => onOpen(s.date)}
              onDelete={() => onDelete(s)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// ARCHIVED GROUP (collapsible)
// ============================================

function ArchivedGroup({
  sessions,
  onOpen,
  onDelete,
}: {
  sessions: OpenMicSession[]
  onOpen: (iso: string) => void
  onDelete: (session: OpenMicSession) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 mb-3 text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-white border border-rosewood/10 flex items-center justify-center text-rosewood/60 shrink-0">
          <FolderArchive className="w-4 h-4" />
        </div>
        <h2 className="font-host-grotesk font-bold text-xl text-rosewood">
          Archived
        </h2>
        <span className="font-host-grotesk text-xs text-rosewood/40">
          · {sessions.length} past
        </span>
        <ChevronDown
          className={`w-4 h-4 text-rosewood/40 ml-auto transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="space-y-2">
          {sessions.map((s) => (
            <SessionRow
              key={s.date}
              session={s}
              onOpen={() => onOpen(s.date)}
              onDelete={() => onDelete(s)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// SESSION ROW
// ============================================

function SessionRow({
  session,
  onOpen,
  onDelete,
}: {
  session: OpenMicSession
  onOpen: () => void
  onDelete: () => void
}) {
  const state: SessionState = classifySession(session.date)
  const stateStyle =
    state === 'current'
      ? 'bg-chartreuse/20 text-cypress'
      : state === 'upcoming'
      ? 'bg-rosewood/10 text-rosewood/60'
      : 'bg-rosewood/5 text-rosewood/40'

  return (
    <div className="group bg-white rounded-xl border border-rosewood/5 shadow-sm hover:border-chartreuse transition-all flex items-center">
      <button
        onClick={onOpen}
        className="flex-1 text-left p-4 min-w-0"
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${stateStyle}`}
          >
            {state === 'current'
              ? 'Current'
              : state === 'upcoming'
              ? 'Upcoming'
              : 'Archived'}
          </span>
        </div>
        <p className="font-bold text-rosewood truncate">
          {formatSessionLong(session.date)}
        </p>
        <p className="text-sm text-rosewood/50">
          {session.lineup.length} artist
          {session.lineup.length === 1 ? '' : 's'} scheduled
          {state === 'past' && ' · read-only'}
        </p>
      </button>

      <div className="flex items-center gap-1 pr-3 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-2 text-rosewood/30 hover:text-poppy transition-colors"
          title="Delete session"
          aria-label="Delete session"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={onOpen}
          className="p-2 text-rosewood/30 hover:text-chartreuse transition-colors"
          title="Open session"
          aria-label="Open session"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// ============================================
// POOL ROW (with edit / delete actions)
// ============================================

function PoolRow({
  submission,
  onEdit,
  onDelete,
}: {
  submission: OpenMicSubmission
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group p-3 bg-plaster/20 rounded-lg border border-rosewood/5 hover:border-rosewood/15 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-rosewood text-sm truncate">
            {submission.artistName}
          </p>
          <p className="text-xs text-rosewood/60 truncate">
            {submission.fullName}
          </p>
          <p className="text-xs text-rosewood/60 truncate">
            {submission.genre} · {submission.email}
          </p>
          {submission.instagram && (
            <p className="text-xs text-rosewood/40 mt-0.5 truncate">
              {submission.instagram}
            </p>
          )}
          {submission.musicLink && (
            <a
              href={submission.musicLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-chartreuse hover:text-chartreuse/80 transition-colors inline-block mt-1 truncate max-w-full"
            >
              {submission.musicLink}
            </a>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="text-rosewood/30 hover:text-chartreuse transition-colors p-1.5"
            title="Edit submission"
            aria-label="Edit submission"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="text-rosewood/30 hover:text-poppy transition-colors p-1.5"
            title="Delete submission"
            aria-label="Delete submission"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}