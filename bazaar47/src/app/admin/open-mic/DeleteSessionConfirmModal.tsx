// app/admin/open-mic/DeleteSessionConfirmModal.tsx
'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertTriangle, Calendar, Users } from 'lucide-react'
import type { OpenMicSession } from '@/types/open-mic'
import type { SessionState } from '@/lib/open-mic/sessions-state'
import { formatSessionLong } from '@/lib/open-mic/dates'

// ============================================
// TYPES
// ============================================

interface DeleteSessionConfirmModalProps {
  session: OpenMicSession
  sessionState: SessionState
  onClose: () => void
  onDeleted: (dateIso: string) => void
}

// ============================================
// COPY
// ============================================

function getBodyCopy(
  sessionState: SessionState,
  artistCount: number
): { title: string; lead: string } {
  if (sessionState === 'past') {
    return {
      title: 'Delete Archived Session',
      lead:
        'This session already happened. Deleting it removes the historical record permanently.',
    }
  }
  if (sessionState === 'current') {
    return {
      title: "Delete Today's Session",
      lead:
        "This session is happening today. Deleting it will remove tonight's lineup.",
    }
  }
  return {
    title: 'Delete Upcoming Session',
    lead:
      'This session has not happened yet. Deleting it will remove the lineup.',
  }
}

// ============================================
// COMPONENT
// ============================================

export function DeleteSessionConfirmModal({
  session,
  sessionState,
  onClose,
  onDeleted,
}: DeleteSessionConfirmModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const artistCount = session.lineup.length
  const copy = getBodyCopy(sessionState, artistCount)

  const handleDelete = async () => {
    setError(null)
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/admin/open-mic/sessions/${session.date}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Failed to delete session')
        return
      }
      onDeleted(session.date)
      onClose()
    } catch (err) {
      console.error('Delete session error:', err)
      setError('Network error — please try again')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-rosewood/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-rosewood/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-poppy/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-poppy" />
            </div>
            <div>
              <h3 className="font-host-grotesk font-bold text-xl text-rosewood">
                {copy.title}
              </h3>
              <p className="font-host-grotesk text-sm text-rosewood/50 mt-0.5">
                This cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="font-host-grotesk text-sm text-rosewood/70">
            {copy.lead}
          </p>

          <div className="bg-plaster/40 border border-rosewood/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 font-host-grotesk text-sm text-rosewood">
              <Calendar className="w-4 h-4 text-rosewood/50 shrink-0" />
              <span className="font-semibold">
                {formatSessionLong(session.date)}
              </span>
            </div>
            <div className="flex items-center gap-2 font-host-grotesk text-sm text-rosewood/70">
              <Users className="w-4 h-4 text-rosewood/50 shrink-0" />
              <span>
                {artistCount} artist{artistCount === 1 ? '' : 's'} in the
                lineup
              </span>
            </div>
          </div>

          {sessionState === 'past' && (
            <div className="bg-poppy/5 border border-poppy/20 rounded-xl p-3">
              <p className="font-host-grotesk text-xs text-rosewood/70">
                ⚠️ This session is part of your historical record. Once
                deleted, there is no way to recover the lineup. The artists
                remain in the pool.
              </p>
            </div>
          )}

          {sessionState !== 'past' && (
            <p className="font-host-grotesk text-xs text-rosewood/50">
              Artists scheduled for this session stay in the pool and can be
              added to a different session.
            </p>
          )}

          {error && (
            <div className="bg-poppy/10 border border-poppy/20 rounded-xl p-3">
              <p className="text-poppy text-sm font-host-grotesk">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-poppy hover:bg-poppy/90 text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all disabled:opacity-50 flex items-center gap-2 flex-1 justify-center"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete Session
          </button>
          <button
            onClick={onClose}
            disabled={deleting}
            className="bg-rosewood/10 hover:bg-rosewood/20 text-rosewood/60 px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}