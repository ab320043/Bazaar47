// app/staff/(app)/checklist/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Link as LinkIcon,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
  Pencil,
} from 'lucide-react'
import type {
  StaffChecklist,
  ChecklistItem,
  ChecklistItemKind,
} from '@/types/staff'

// ============================================
// TYPES
// ============================================

interface AddForm {
  kind: ChecklistItemKind
  title: string
  detail: string
}

// ============================================
// MAIN
// ============================================

export default function StaffChecklistPage() {
  const [checklist, setChecklist] = useState<StaffChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchChecklist = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null)
    try {
      const res = await fetch('/api/staff/checklists')
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/staff/login'
          return
        }
        if (!opts?.silent) setError('Failed to load checklist')
        return
      }
      const body = await res.json()
      setChecklist(body.checklist)
    } catch (err) {
      console.error('Checklist fetch error:', err)
      if (!opts?.silent) setError('Network error — please try again')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchChecklist()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchChecklist])

  // ---- Item CRUD helpers ----

  const handleAddItem = async (form: AddForm) => {
    const res = await fetch('/api/staff/checklists/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: form.kind,
        title: form.title,
        detail: form.detail,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to add item')
    }
    const body = await res.json()
    setChecklist((prev) =>
      prev ? { ...prev, items: [...prev.items, body.item] } : prev
    )
  }

  const handleToggle = async (itemId: string, done: boolean) => {
    setChecklist((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) =>
              i.id === itemId ? { ...i, done } : i
            ),
          }
        : prev
    )
    try {
      const res = await fetch(`/api/staff/checklists/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      })
      if (!res.ok) {
        // Revert
        setChecklist((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((i) =>
                  i.id === itemId ? { ...i, done: !done } : i
                ),
              }
            : prev
        )
      }
    } catch {
      setChecklist((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.id === itemId ? { ...i, done: !done } : i
              ),
            }
          : prev
      )
    }
  }

  const handleDeleteItem = async (itemId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      const res = await fetch(`/api/staff/checklists/items/${itemId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setChecklist((prev) =>
          prev
            ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) }
            : prev
        )
      }
    } catch {
      alert('Failed to delete item')
    }
  }

  const handleUpdateItem = async (
    itemId: string,
    updates: { title?: string; detail?: string }
  ) => {
    const res = await fetch(`/api/staff/checklists/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to update item')
    }
    const body = await res.json()
    setChecklist((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) =>
              i.id === itemId ? body.item : i
            ),
          }
        : prev
    )
  }

  // ---- Loading / error ----

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <div className="text-rosewood/60 font-host-grotesk">Loading checklist...</div>
      </div>
    )
  }

  if (error || !checklist) {
    return (
      <div className="p-6 lg:p-10">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">
          ⚠️ Error
        </div>
        <div className="text-rosewood/60 font-host-grotesk">
          {error || 'No checklist available'}
        </div>
        <button
          onClick={() => fetchChecklist()}
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const items = checklist.items
  const doneCount = items.filter((i) => i.done).length
  const total = items.length
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-3xl mx-auto">

      {/* Title + create */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
            My Checklist
          </h1>
          <p className="font-host-grotesk text-rosewood/50 text-sm mt-0.5">
            {total === 0
              ? 'A personal to-do list'
              : `${doneCount} of ${total} done`}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Add item'}
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-6">
          <div className="h-2 bg-plaster rounded-full overflow-hidden">
            <div
              className="h-full bg-chartreuse transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <AddItemForm
          onAdd={async (form) => {
            await handleAddItem(form)
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Empty state */}
      {total === 0 && !showAddForm && (
        <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
          <FileText className="w-16 h-16 text-rosewood/20 mx-auto mb-4" />
          <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">
            Nothing on your list
          </h3>
          <p className="font-host-grotesk text-rosewood/50 mt-2">
            Add a task, a link to a document, or a reminder for yourself.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-6 inline-flex items-center gap-2 bg-chartreuse hover:bg-chartreuse/90 text-grove px-6 py-2 rounded-xl font-host-grotesk font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add your first item
          </button>
        </div>
      )}

      {/* Items list */}
      {total > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onDelete={handleDeleteItem}
              onUpdate={handleUpdateItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// ADD ITEM FORM
// ============================================

function AddItemForm({
  onAdd,
  onCancel,
}: {
  onAdd: (form: AddForm) => Promise<void>
  onCancel: () => void
}) {
  const [kind, setKind] = useState<ChecklistItemKind>('text')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (kind === 'link') {
      if (!detail.trim()) {
        setError('Link URL is required for link items')
        return
      }
      try {
        const url = new URL(detail.trim())
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new Error('bad protocol')
        }
      } catch {
        setError('Please enter a valid http(s) URL')
        return
      }
    }

    setIsSaving(true)
    try {
      await onAdd({ kind, title, detail })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-5 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="font-host-grotesk font-semibold text-sm text-rosewood">
          Add item
        </span>
        <div className="flex bg-plaster rounded-lg p-0.5 ml-2">
          <button
            type="button"
            onClick={() => setKind('text')}
            className={`px-3 py-1 rounded-md text-xs font-host-grotesk font-semibold transition-colors ${
              kind === 'text'
                ? 'bg-rosewood text-plaster'
                : 'text-rosewood/60 hover:text-rosewood'
            }`}
          >
            To-do
          </button>
          <button
            type="button"
            onClick={() => setKind('link')}
            className={`px-3 py-1 rounded-md text-xs font-host-grotesk font-semibold transition-colors ${
              kind === 'link'
                ? 'bg-rosewood text-plaster'
                : 'text-rosewood/60 hover:text-rosewood'
            }`}
          >
            Link
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
            Title <span className="text-poppy">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === 'link' ? 'e.g. Setup guide' : 'e.g. Bring extension cords'
            }
            required
            className="w-full px-4 py-2.5 bg-plaster/40 border border-rosewood/15 rounded-xl font-host-grotesk text-sm text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 focus:bg-white transition-all"
          />
        </div>

        {kind === 'link' ? (
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              URL <span className="text-poppy">*</span>
            </label>
            <input
              type="url"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="https://..."
              required
              className="w-full px-4 py-2.5 bg-plaster/40 border border-rosewood/15 rounded-xl font-host-grotesk text-sm text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 focus:bg-white transition-all"
            />
          </div>
        ) : (
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Detail (optional)
            </label>
            <input
              type="text"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Any extra context"
              className="w-full px-4 py-2.5 bg-plaster/40 border border-rosewood/15 rounded-xl font-host-grotesk text-sm text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 focus:bg-white transition-all"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-poppy text-sm font-host-grotesk">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex gap-2 mt-4 pt-4 border-t border-rosewood/10">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-5 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-rosewood/10 hover:bg-rosewood/20 text-rosewood/60 px-5 py-2 rounded-xl font-host-grotesk font-semibold text-sm transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ============================================
// CHECKLIST ROW
// ============================================

function ChecklistRow({
  item,
  onToggle,
  onDelete,
  onUpdate,
}: {
  item: ChecklistItem
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string, title: string) => void
  onUpdate: (id: string, updates: { title?: string; detail?: string }) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [editDetail, setEditDetail] = useState(item.detail || '')
  const [saving, setSaving] = useState(false)

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await onUpdate(item.id, {
        title: editTitle,
        detail: editDetail,
      })
      setEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditTitle(item.title)
    setEditDetail(item.detail || '')
    setEditing(false)
  }

  // ---- Edit mode ----
  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-chartreuse/40 shadow-sm p-4">
        <div className="space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 bg-plaster/40 border border-rosewood/15 rounded-lg font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
            placeholder="Title"
          />
          <input
            type={item.kind === 'link' ? 'url' : 'text'}
            value={editDetail}
            onChange={(e) => setEditDetail(e.target.value)}
            className="w-full px-3 py-2 bg-plaster/40 border border-rosewood/15 rounded-lg font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
            placeholder={item.kind === 'link' ? 'URL' : 'Detail (optional)'}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSaveEdit}
            disabled={saving}
            className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Save
          </button>
          <button
            onClick={handleCancel}
            className="bg-rosewood/10 hover:bg-rosewood/20 text-rosewood/60 px-4 py-1.5 rounded-lg font-host-grotesk font-semibold text-xs transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ---- Display mode ----
  const isLink = item.kind === 'link'

  return (
    <div
      className={`group bg-white rounded-xl border shadow-sm p-4 transition-all ${
        item.done
          ? 'border-rosewood/5 opacity-70'
          : 'border-rosewood/5 hover:border-rosewood/15'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(item.id, !item.done)}
          className="shrink-0 mt-0.5"
          aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
        >
          {item.done ? (
            <CheckCircle2 className="w-5 h-5 text-chartreuse" />
          ) : (
            <Circle className="w-5 h-5 text-rosewood/30 hover:text-rosewood/60 transition-colors" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isLink && (
              <LinkIcon className="w-3.5 h-3.5 text-rosewood/40 shrink-0" />
            )}
            <p
              className={`font-host-grotesk font-semibold text-rosewood ${
                item.done ? 'line-through text-rosewood/50' : ''
              }`}
            >
              {item.title}
            </p>
          </div>

          {/* Detail / URL */}
          {isLink && item.detail && (
            <a
              href={item.detail}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-chartreuse hover:text-chartreuse/80 mt-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {item.detail}
            </a>
          )}
          {!isLink && item.detail && (
            <p className="font-host-grotesk text-xs text-rosewood/50 mt-1">
              {item.detail}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="text-rosewood/30 hover:text-rosewood/70 transition-colors p-1"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id, item.title)}
            className="text-rosewood/30 hover:text-poppy transition-colors p-1"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}