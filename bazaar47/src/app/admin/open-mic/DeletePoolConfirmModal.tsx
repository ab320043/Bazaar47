// app/admin/open-mic/DeletePoolConfirmModal.tsx
'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertTriangle, Calendar } from 'lucide-react'
import type { OpenMicSubmission, OpenMicSession } from '@/types/open-mic'
import { formatSessionLong } from '@/lib/open-mic/dates'

// ============================================
// TYPES
// ============================================

interface DeletePoolConfirmModalProps {
  submission: OpenMicSubmission
  sessions: OpenMicSession[]
  onClose: () => void
  onDeleted: () => void
}

// ============================================
// COMPONENT
// ============================================

export function DeletePoolConfirmModal({
  submission,
  sessions,
  onClose,
  onDeleted,
}: DeletePoolConfirmModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Which sessions currently have this artist in their lineup?
  const affectedSessions = sessions.filter((s) =>
    s.lineup.some((slot) => slot.submissionId === submission.id)
  )

  const handleDelete = async () => {
    setError(null)
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/open-mic/${submission.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Failed to delete submission')
        return
      }
      onDeleted()
      onClose()
    } catch (err) {
      console.error('Delete pool submission error:', err)
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
                Delete Submission
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
            You are about to permanently delete{' '}
            <span className="font-semibold text-rosewood">
              {submission.artistName}
            </span>
            &apos;s submission from the artist pool.
          </p>

          {affectedSessions.length > 0 && (
            <div className="bg-poppy/5 border border-poppy/20 rounded-xl p-3">
              <p className="font-host-grotesk font-semibold text-sm text-poppy mb-2">
                ⚠️ This artist is currently in{' '}
                {affectedSessions.length} lineup
                {affectedSessions.length === 1 ? '' : 's'}
              </p>
              <ul className="space-y-1">
                {affectedSessions.map((s) => (
                  <li
                    key={s.date}
                    className="flex items-center gap-1.5 font-host-grotesk text-xs text-rosewood/70"
                  >
                    <Calendar className="w-3 h-3 text-rosewood/40 shrink-0" />
                    {formatSessionLong(s.date)}
                  </li>
                ))}
              </ul>
              <p className="font-host-grotesk text-xs text-rosewood/60 mt-2">
                They will be removed from these lineups too. The rest of
                each schedule stays intact and the times re-flow
                automatically on next open.
              </p>
            </div>
          )}

          {affectedSessions.length === 0 && (
            <p className="font-host-grotesk text-sm text-rosewood/60">
              This artist is not currently scheduled in any lineup. Nothing
              else will be affected.
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
            Delete Submission
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