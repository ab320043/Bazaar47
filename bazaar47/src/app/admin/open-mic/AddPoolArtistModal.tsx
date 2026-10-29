// app/admin/open-mic/AddPoolArtistModal.tsx
'use client'

import { useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import type { OpenMicSubmission } from '@/types/open-mic'

interface AddPoolArtistModalProps {
  onClose: () => void
  onSuccess: (newArtist: OpenMicSubmission) => void
}

export function AddPoolArtistModal({ onClose, onSuccess }: AddPoolArtistModalProps) {
  const [form, setForm] = useState({
    fullName: '',
    artistName: '',
    genre: '',
    email: '',
    instagram: '',
    musicLink: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.fullName.trim() || !form.artistName.trim() || !form.genre.trim() || !form.email.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/open-mic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_to_pool',
          fullName: form.fullName.trim(),
          artistName: form.artistName.trim(),
          genre: form.genre.trim(),
          email: form.email.trim(),
          instagram: form.instagram.trim() || undefined,
          musicLink: form.musicLink.trim() || undefined,
          submittedAt: new Date().toISOString(),
          addedByAdmin: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add artist to pool')
      }

      onSuccess(data.submission as OpenMicSubmission)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
        <div className="sticky top-0 bg-white border-b border-rosewood/10 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="font-host-grotesk font-bold text-xl text-rosewood">
              Add Artist to Pool
            </h3>
            <p className="font-host-grotesk text-sm text-rosewood/50 mt-0.5">
              They will appear in the pool to be scheduled later.
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
              Full Name <span className="text-poppy">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
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
              onChange={(e) => setForm({ ...form, artistName: e.target.value })}
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
              Instagram
            </label>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@handle"
              className="w-full px-4 py-2 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
            />
          </div>

          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Music Link
            </label>
            <input
              type="url"
              value={form.musicLink}
              onChange={(e) => setForm({ ...form, musicLink: e.target.value })}
              placeholder="https://..."
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
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all disabled:opacity-50 flex-1 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add to Pool
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