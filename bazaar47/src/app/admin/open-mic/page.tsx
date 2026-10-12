// app/admin/open-mic/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Mic2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  Mail,
  // Instagram,
  Music2,
  Link as LinkIcon,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type { OpenMicSubmission, OpenMicSession } from '@/types/open-mic'

// ============================================
// TYPES
// ============================================

interface ApiResponse {
  sessions: OpenMicSession[]
  currentSessionIso: string | null
  nextSessionIso: string | null
  totalSubmissions: number
}

type SessionFilter = 'all' | 'upcoming' | 'past'

// ============================================
// HELPERS
// ============================================

function formatSessionLong(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatSessionShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================
// MAIN PAGE
// ============================================

export default function AdminOpenMicPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SessionFilter>('all')
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set()
  )
  const [showAddModal, setShowAddModal] = useState<string | null>(null)
  const [editingSubmission, setEditingSubmission] =
    useState<OpenMicSubmission | null>(null)

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null)
    try {
      const res = await fetch('/api/admin/open-mic')
      if (!res.ok) {
        if (!opts?.silent) setError('Failed to load Open Mic sessions')
        return
      }
      const body = (await res.json()) as ApiResponse
      setData(body)

      if (!opts?.silent && body.nextSessionIso) {
        setExpandedSessions((prev) => {
          if (prev.size === 0) {
            return new Set([body.nextSessionIso!])
          }
          return prev
        })
      }
    } catch (err) {
      console.error('Open Mic fetch error:', err)
      if (!opts?.silent) setError('Network error — please try again')
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

  const toggleSession = (iso: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(iso)) next.delete(iso)
      else next.add(iso)
      return next
    })
  }

  const handleDeleteSubmission = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}'s submission? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/open-mic/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchData({ silent: true })
      } else {
        alert('Failed to delete submission')
      }
    } catch {
      alert('Network error while deleting')
    }
  }

  const handleAddSubmit = async (
    sessionIso: string,
    payload: {
      fullName: string
      artistName: string
      genre: string
      musicLink?: string
      instagram?: string
      email: string
      sendConfirmation: boolean
    }
  ) => {
    const res = await fetch('/api/admin/open-mic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionDate: sessionIso, ...payload }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to add submission')
    }
    await fetchData({ silent: true })
  }

  const handleEditSubmit = async (
    id: string,
    payload: {
      fullName: string
      artistName: string
      genre: string
      musicLink?: string
      instagram?: string
      email: string
    }
  ) => {
    const res = await fetch(`/api/admin/open-mic/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to update submission')
    }
    await fetchData({ silent: true })
  }

  // ---- Filtered sessions ----

  const filteredSessions = useMemo(() => {
    if (!data) return []
    if (filter === 'all') return data.sessions
    if (filter === 'upcoming') {
      return data.sessions.filter((s) => !s.isPast)
    }
    return data.sessions.filter((s) => s.isPast)
  }, [data, filter])

  // ---- Loading / error ----

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">
          Loading Open Mic sessions...
        </div>
      </div>
    )
  }

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
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood flex items-center gap-3">
              <Mic2 className="w-8 h-8 text-rosewood/60" />
              Open Mic
            </h1>
            <p className="font-host-grotesk text-rosewood/50 mt-1">
              {data.sessions.length} sessions · {data.totalSubmissions} total submissions
            </p>
          </div>
          <button
            onClick={() => fetchData()}
            className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'upcoming', 'past'] as const).map((f) => (
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

        {/* Sessions list */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
            <AlertCircle className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
            <p className="font-host-grotesk text-rosewood/50">
              No sessions to show.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const isExpanded = expandedSessions.has(session.sessionDate)
              const isTonight = session.isToday
              const isNext = data.nextSessionIso === session.sessionDate

              return (
                <div
                  key={session.sessionDate}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    isTonight
                      ? 'border-chartreuse/40 ring-1 ring-chartreuse/20'
                      : isNext
                      ? 'border-rosewood/20'
                      : 'border-rosewood/5'
                  }`}
                >
                  {/* Session header row — clickable div (not a button,
                      so the inner Add button is valid HTML) */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSession(session.sessionDate)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleSession(session.sessionDate)
                      }
                    }}
                    className="w-full text-left p-4 hover:bg-plaster/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chartreuse/40 focus-visible:ring-inset"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isTonight
                              ? 'bg-chartreuse/20'
                              : 'bg-rosewood/10'
                          }`}
                        >
                          <Calendar
                            className={`w-5 h-5 ${
                              isTonight ? 'text-cypress' : 'text-rosewood/50'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-host-grotesk font-bold text-rosewood">
                              {formatSessionLong(session.sessionDate)}
                            </p>
                            {isTonight && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-chartreuse text-grove">
                                Tonight
                              </span>
                            )}
                            {isNext && !isTonight && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-hippie/20 text-hippie">
                                Next
                              </span>
                            )}
                            {session.isPast && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosewood/10 text-rosewood/50">
                                Past
                              </span>
                            )}
                            {session.isOpen && !session.isPast && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-chartreuse/15 text-cypress">
                                Open
                              </span>
                            )}
                          </div>
                          <p className="font-host-grotesk text-xs text-rosewood/50 mt-0.5">
                            {session.submissions.length}{' '}
                            {session.submissions.length === 1
                              ? 'artist'
                              : 'artists'}{' '}
                            signed up
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowAddModal(session.sessionDate)
                          }}
                          className="inline-flex items-center gap-1 bg-chartreuse hover:bg-chartreuse/90 text-grove px-3 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-rosewood/40" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-rosewood/40" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submissions */}
                  {isExpanded && (
                    <div className="border-t border-rosewood/10 bg-plaster/20">
                      {session.submissions.length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="font-host-grotesk text-sm text-rosewood/40">
                            No submissions yet for this session.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-rosewood/5">
                          {session.submissions.map((submission) => (
                            <SubmissionRow
                              key={submission.id}
                              submission={submission}
                              onEdit={() =>
                                setEditingSubmission(submission)
                              }
                              onDelete={() =>
                                handleDeleteSubmission(
                                  submission.id,
                                  submission.artistName
                                )
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add submission modal */}
      {showAddModal && (
        <AddSubmissionModal
          sessionIso={showAddModal}
          onClose={() => setShowAddModal(null)}
          onSubmit={handleAddSubmit}
        />
      )}

      {/* Edit submission modal */}
      {editingSubmission && (
        <EditSubmissionModal
          submission={editingSubmission}
          onClose={() => setEditingSubmission(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  )
}

// ============================================
// SUBMISSION ROW
// ============================================

function SubmissionRow({
  submission,
  onEdit,
  onDelete,
}: {
  submission: OpenMicSubmission
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="p-4 flex items-start justify-between gap-3 hover:bg-plaster/30 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-host-grotesk font-bold text-rosewood">
            {submission.artistName}
          </p>
          {submission.addedByAdmin && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rosewood/10 text-rosewood/60">
              Added by admin
            </span>
          )}
        </div>
        <p className="font-host-grotesk text-xs text-rosewood/50 mt-0.5">
          {submission.fullName}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-rosewood/50">
          <span className="flex items-center gap-1">
            <Music2 className="w-3 h-3" />
            {submission.genre}
          </span>
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {submission.email}
          </span>
          {submission.instagram && (
            <span className="flex items-center gap-1">
              {/* <Instagram className="w-3 h-3" /> */}
              {submission.instagram}
            </span>
          )}
        </div>
        {submission.musicLink && (
          <a
            href={submission.musicLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-chartreuse hover:text-chartreuse/80 mt-1.5 transition-colors"
          >
            <LinkIcon className="w-3 h-3" />
            {submission.musicLink}
          </a>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-rosewood/30 font-mono mr-2 hidden sm:block">
          {formatTimestamp(submission.submittedAt)}
        </span>
        <button
          onClick={onEdit}
          className="text-rosewood/30 hover:text-chartreuse transition-colors p-1.5"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="text-rosewood/30 hover:text-poppy transition-colors p-1.5"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ============================================
// ADD SUBMISSION MODAL
// ============================================

function AddSubmissionModal({
  sessionIso,
  onClose,
  onSubmit,
}: {
  sessionIso: string
  onClose: () => void
  onSubmit: (
    sessionIso: string,
    payload: {
      fullName: string
      artistName: string
      genre: string
      musicLink?: string
      instagram?: string
      email: string
      sendConfirmation: boolean
    }
  ) => Promise<void>
}) {
  const [form, setForm] = useState({
    fullName: '',
    artistName: '',
    genre: '',
    musicLink: '',
    instagram: '',
    email: '',
  })
  const [sendConfirmation, setSendConfirmation] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (
      !form.fullName.trim() ||
      !form.artistName.trim() ||
      !form.genre.trim() ||
      !form.email.trim()
    ) {
      setError('All fields except Music link and Instagram are required')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(sessionIso, {
        fullName: form.fullName.trim(),
        artistName: form.artistName.trim(),
        genre: form.genre.trim(),
        musicLink: form.musicLink.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        email: form.email.trim(),
        sendConfirmation,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-rosewood/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white p-6 border-b border-rosewood/10 flex items-center justify-between">
          <div>
            <h3 className="font-host-grotesk font-bold text-xl text-rosewood">
              Add submission
            </h3>
            <p className="font-host-grotesk text-sm text-rosewood/50">
              {formatSessionShort(sessionIso)}
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
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Full name <span className="text-poppy">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
          </div>
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Artist name <span className="text-poppy">*</span>
            </label>
            <input
              type="text"
              value={form.artistName}
              onChange={(e) =>
                setForm({ ...form, artistName: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
          </div>
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Genre <span className="text-poppy">*</span>
            </label>
            <input
              type="text"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
          </div>
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Link to Music
            </label>
            <input
              type="url"
              value={form.musicLink}
              onChange={(e) =>
                setForm({ ...form, musicLink: e.target.value })
              }
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              placeholder="https://... (optional)"
            />
          </div>
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Instagram
            </label>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) =>
                setForm({ ...form, instagram: e.target.value })
              }
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              placeholder="yourhandle"
            />
          </div>
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Email <span className="text-poppy">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendConfirmation}
              onChange={(e) => setSendConfirmation(e.target.checked)}
              className="w-4 h-4 accent-chartreuse"
            />
            <span className="font-host-grotesk text-sm text-rosewood/80">
              Send confirmation email to artist
            </span>
          </label>

          {error && (
            <div className="bg-poppy/10 border border-poppy/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-poppy shrink-0 mt-0.5" />
              <p className="text-poppy text-sm font-host-grotesk">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-rosewood/10">
            <button
              type="submit"
              disabled={submitting}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all disabled:opacity-50 flex-1 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add submission
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

// ============================================
// EDIT SUBMISSION MODAL
// ============================================

function EditSubmissionModal({
  submission,
  onClose,
  onSubmit,
}: {
  submission: OpenMicSubmission
  onClose: () => void
  onSubmit: (
    id: string,
    payload: {
      fullName: string
      artistName: string
      genre: string
      musicLink?: string
      instagram?: string
      email: string
    }
  ) => Promise<void>
}) {
  const [form, setForm] = useState({
    fullName: submission.fullName,
    artistName: submission.artistName,
    genre: submission.genre,
    musicLink: submission.musicLink || '',
    instagram: submission.instagram || '',
    email: submission.email,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(submission.id, {
        fullName: form.fullName.trim(),
        artistName: form.artistName.trim(),
        genre: form.genre.trim(),
        // Send empty string to explicitly clear the field
        musicLink: form.musicLink.trim(),
        instagram: form.instagram.trim() || undefined,
        email: form.email.trim(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-rosewood/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white p-6 border-b border-rosewood/10 flex items-center justify-between">
          <h3 className="font-host-grotesk font-bold text-xl text-rosewood">
            Edit submission
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-plaster/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-rosewood/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Full name
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
          </div>
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Artist name
            </label>
            <input
              type="text"
              value={form.artistName}
              onChange={(e) =>
                setForm({ ...form, artistName: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
          </div>
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Genre
            </label>
            <input
              type="text"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
          </div>
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Link to Music
            </label>
            <input
              type="url"
              value={form.musicLink}
              onChange={(e) =>
                setForm({ ...form, musicLink: e.target.value })
              }
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              placeholder="https://... (optional)"
            />
          </div>
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Instagram
            </label>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) =>
                setForm({ ...form, instagram: e.target.value })
              }
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
          </div>
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
          </div>

          {error && (
            <div className="bg-poppy/10 border border-poppy/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-poppy shrink-0 mt-0.5" />
              <p className="text-poppy text-sm font-host-grotesk">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-rosewood/10">
            <button
              type="submit"
              disabled={submitting}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all disabled:opacity-50 flex-1"
            >
              {submitting ? 'Saving...' : 'Save changes'}
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