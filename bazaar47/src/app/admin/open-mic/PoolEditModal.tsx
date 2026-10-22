// app/admin/open-mic/PoolEditModal.tsx
'use client'

import { useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import type { OpenMicSubmission } from '@/types/open-mic'

// ============================================
// TYPES
// ============================================

export interface PoolEditPayload {
  fullName: string
  artistName: string
  genre: string
  email: string
  musicLink?: string
  instagram?: string
}

interface PoolEditModalProps {
  submission: OpenMicSubmission
  onClose: () => void
  onSaved: (updated: OpenMicSubmission) => void
}

// ============================================
// COMPONENT
// ============================================

export function PoolEditModal({
  submission,
  onClose,
  onSaved,
}: PoolEditModalProps) {
  const [form, setForm] = useState({
    fullName: submission.fullName,
    artistName: submission.artistName,
    genre: submission.genre,
    email: submission.email,
    musicLink: submission.musicLink || '',
    instagram: submission.instagram || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // ---- Local validation ----
    if (!form.fullName.trim()) {
      setError('Full name is required')
      return
    }
    if (!form.artistName.trim()) {
      setError('Artist name is required')
      return
    }
    if (!form.genre.trim()) {
      setError('Genre is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('A valid email is required')
      return
    }

    // musicLink is optional. If provided, must be http(s).
    const trimmedLink = form.musicLink.trim()
    if (trimmedLink !== '') {
      try {
        const url = new URL(trimmedLink)
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new Error('bad protocol')
        }
      } catch {
        setError('Music link must be a valid http(s) URL (or leave it blank)')
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/open-mic/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          artistName: form.artistName.trim(),
          genre: form.genre.trim(),
          email: form.email.trim(),
          // Send empty string to explicitly clear musicLink; undefined to leave
          musicLink: trimmedLink,
          instagram: form.instagram.trim(),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Failed to update submission')
        return
      }

      const body = await res.json()
      if (body?.submission) {
        onSaved(body.submission as OpenMicSubmission)
      }
      onClose()
    } catch (err) {
      console.error('Pool edit error:', err)
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-rosewood/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-rosewood/10 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="font-host-grotesk font-bold text-xl text-rosewood">
              Edit Submission
            </h3>
            <p className="font-host-grotesk text-sm text-rosewood/50 mt-0.5">
              {submission.artistName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-plaster/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-rosewood/60" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Full Name <span className="text-poppy">*</span>
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
              Artist Name <span className="text-poppy">*</span>
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
              placeholder="https://... (optional)"
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
            <p className="font-host-grotesk text-xs text-rosewood/40 mt-1">
              Leave blank to remove the link.
            </p>
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
              placeholder="yourhandle"
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
              disabled={saving}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
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