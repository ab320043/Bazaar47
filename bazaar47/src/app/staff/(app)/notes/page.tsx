// app/staff/(app)/notes/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Search,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react'
import type { StaffNote } from '@/types/staff'

// ============================================
// HELPERS
// ============================================

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(iso).toLocaleDateString()
}

function previewText(body: string): string {
  const trimmed = body.trim()
  if (trimmed === '') return 'Empty note'
  return trimmed.length > 160 ? trimmed.slice(0, 160) + '…' : trimmed
}

// ============================================
// MAIN
// ============================================

export default function StaffNotesPage() {
  const [notes, setNotes] = useState<StaffNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [openNoteId, setOpenNoteId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchNotes = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null)
    try {
      const res = await fetch('/api/staff/notes')
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/staff/login'
          return
        }
        if (!opts?.silent) setError('Failed to load notes')
        return
      }
      const body = await res.json()
      setNotes(body.notes || [])
    } catch (err) {
      console.error('Notes fetch error:', err)
      if (!opts?.silent) setError('Network error — please try again')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchNotes()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchNotes])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/staff/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled', body: '' }),
      })
      if (!res.ok) {
        setError('Failed to create note')
        return
      }
      const body = await res.json()
      setNotes((prev) => [body.note, ...prev])
      setOpenNoteId(body.note.id)
    } catch {
      setError('Network error while creating note')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (noteId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/staff/notes/${noteId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId))
        if (openNoteId === noteId) setOpenNoteId(null)
      } else {
        alert('Failed to delete note')
      }
    } catch {
      alert('Network error while deleting note')
    }
  }

  const handleNoteSaved = (updated: StaffNote) => {
    setNotes((prev) =>
      prev
        .map((n) => (n.id === updated.id ? updated : n))
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    )
  }

  const filteredNotes = (() => {
    if (!searchTerm.trim()) return notes
    const s = searchTerm.toLowerCase()
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(s) ||
        n.body.toLowerCase().includes(s)
    )
  })()

  const openNote = openNoteId ? notes.find((n) => n.id === openNoteId) : null

  // ---- Editor view ----

  if (openNote) {
    return (
      <NoteEditor
        note={openNote}
        onBack={() => setOpenNoteId(null)}
        onSaved={handleNoteSaved}
        onDelete={() => handleDelete(openNote.id, openNote.title)}
      />
    )
  }

  // ---- Grid view ----

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <div className="text-rosewood/60 font-host-grotesk">Loading notes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 lg:p-10">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">
          ⚠️ Error
        </div>
        <div className="text-rosewood/60 font-host-grotesk">{error}</div>
        <button
          onClick={() => fetchNotes()}
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-6xl mx-auto">

      {/* Title + create */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
            Notes
          </h1>
          <p className="font-host-grotesk text-rosewood/50 text-sm mt-0.5">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New note
        </button>
      </div>

      {/* Search */}
      {notes.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rosewood/30" />
          <input
            type="text"
            placeholder="Search notes..."
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
      )}

      {/* Empty states */}
      {notes.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
          <FileText className="w-16 h-16 text-rosewood/20 mx-auto mb-4" />
          <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">
            No notes yet
          </h3>
          <p className="font-host-grotesk text-rosewood/50 mt-2">
            Write whatever is on your mind. Only you can see your notes.
          </p>
          <button
            onClick={handleCreate}
            className="mt-6 inline-flex items-center gap-2 bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Write your first note
          </button>
        </div>
      )}

      {notes.length > 0 && filteredNotes.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
          <Search className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
          <p className="font-host-grotesk text-rosewood/50">
            No notes match your search.
          </p>
        </div>
      )}

      {/* Notes grid */}
      {filteredNotes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="group bg-white rounded-2xl border border-rosewood/5 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
              onClick={() => setOpenNoteId(note.id)}
            >
              <div className="p-4 flex-1">
                <h3 className="font-host-grotesk font-bold text-rosewood truncate mb-1.5">
                  {note.title || 'Untitled'}
                </h3>
                <p className="font-host-grotesk text-sm text-rosewood/60 whitespace-pre-wrap line-clamp-4">
                  {previewText(note.body)}
                </p>
              </div>
              <div className="px-4 py-2.5 bg-plaster/40 border-t border-rosewood/5 flex items-center justify-between">
                <span className="font-host-grotesk text-xs text-rosewood/40">
                  {formatRelative(note.updatedAt)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(note.id, note.title)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-rosewood/30 hover:text-poppy transition-all p-1"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// NOTE EDITOR
// ============================================

function NoteEditor({
  note,
  onBack,
  onSaved,
  onDelete,
}: {
  note: StaffNote
  onBack: () => void
  onSaved: (updated: StaffNote) => void
  onDelete: () => void
}) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [lastSavedTitle, setLastSavedTitle] = useState(note.title)
  const [lastSavedBody, setLastSavedBody] = useState(note.body)
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const save = async () => {
    setSaveError(null)
    const trimmedTitle = title.trim() || 'Untitled'
    if (trimmedTitle === lastSavedTitle && body === lastSavedBody) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/staff/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle, body }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSaveError(err.error || 'Failed to save')
        return
      }
      const data = await res.json()
      setLastSavedTitle(trimmedTitle)
      setLastSavedBody(body)
      setTitle(trimmedTitle)
      onSaved(data.note)
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 2000)
    } catch {
      setSaveError('Network error while saving')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={() => {
            void save()
            onBack()
          }}
          className="inline-flex items-center gap-2 text-rosewood/60 hover:text-rosewood font-host-grotesk text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to notes
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {isSaving && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rosewood/40" />
                <span className="font-host-grotesk text-rosewood/40">Saving...</span>
              </>
            )}
            {justSaved && !isSaving && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-chartreuse" />
                <span className="font-host-grotesk text-chartreuse">Saved</span>
              </>
            )}
          </div>
          <button
            onClick={onDelete}
            className="text-rosewood/40 hover:text-poppy transition-colors p-1.5"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-6 md:p-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
          placeholder="Untitled"
          maxLength={120}
          className="w-full font-host-grotesk font-bold text-2xl md:text-3xl text-rosewood placeholder:text-rosewood/30 border-none focus:outline-none bg-transparent mb-4"
        />

        <div className="border-t border-rosewood/10 pt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={save}
            placeholder="Start writing..."
            rows={20}
            className="w-full font-host-grotesk text-base text-rosewood placeholder:text-rosewood/30 border-none focus:outline-none bg-transparent resize-none leading-relaxed"
          />
        </div>

        {saveError && (
          <div className="mt-4 flex items-center gap-2 text-poppy text-sm font-host-grotesk">
            <AlertCircle className="w-4 h-4" />
            {saveError}
          </div>
        )}

        <p className="font-host-grotesk text-xs text-rosewood/30 mt-4">
          Last updated {formatRelative(note.updatedAt)}
        </p>
      </div>
    </div>
  )
}