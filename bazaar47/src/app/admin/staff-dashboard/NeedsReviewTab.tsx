// app/admin/staff-dashboard/NeedsReviewTab.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  Pencil,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { WorkLog } from '@/types/staff-worklog'
import type { ReconcileRunRecord } from '@/lib/staff/reconcile'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// HELPERS
// ============================================

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getRoleLabel(roleId: string): string {
  const role = STAFF_ROLES.find((r) => r.id === roleId)
  return role?.label || roleId
}

// ============================================
// TYPES
// ============================================

interface ApiResponse {
  workLogs: WorkLog[]
  count: number
  recentRuns?: ReconcileRunRecord[]
}

// ============================================
// MAIN COMPONENT
// ============================================

export function NeedsReviewTab() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCronHealth, setShowCronHealth] = useState(false)

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null)
    try {
      const res = await fetch(
        '/api/admin/worklogs?filter=needs-review&includeRuns=true'
      )
      if (!res.ok) {
        if (!opts?.silent) setError('Failed to load work logs')
        return
      }
      const body = (await res.json()) as ApiResponse
      setData(body)
    } catch (err) {
      console.error('Work logs fetch error:', err)
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

  const handleLooksRight = async (id: string) => {
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/worklogs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markReviewed: true,
          reason: 'Reviewed: auto-close matches scheduled end time.',
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Failed to mark reviewed')
        return
      }
      await fetchData({ silent: true })
    } catch {
      alert('Network error')
    } finally {
      setActionId(null)
    }
  }

  const handleSaveEdit = async (
    id: string,
    hoursWorked: number,
    reason: string
  ) => {
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/worklogs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoursWorked,
          markReviewed: true,
          reason,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Failed to save')
        return
      }
      setEditingId(null)
      await fetchData({ silent: true })
    } catch {
      alert('Network error')
    } finally {
      setActionId(null)
    }
  }

  // ---- LOADING ----

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
        <Loader2 className="w-8 h-8 animate-spin text-rosewood/40 mx-auto" />
        <p className="font-host-grotesk text-rosewood/60 mt-3">
          Loading review queue...
        </p>
      </div>
    )
  }

  // ---- ERROR ----

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-poppy/40 mx-auto mb-3" />
        <p className="font-host-grotesk text-rosewood/60">{error}</p>
        <button
          onClick={() => fetchData()}
          className="mt-4 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const workLogs = data?.workLogs || []
  const recentRuns = data?.recentRuns || []

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-host-grotesk font-bold text-xl text-rosewood">
            Needs review
          </h2>
          <p className="font-host-grotesk text-rosewood/50 text-sm mt-0.5">
            {workLogs.length === 0
              ? 'All shifts are reviewed.'
              : `${workLogs.length} shift${workLogs.length === 1 ? '' : 's'} auto-closed and awaiting your review.`}
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

      {/* Cron health panel */}
      <CronHealthPanel
        recentRuns={recentRuns}
        expanded={showCronHealth}
        onToggle={() => setShowCronHealth((v) => !v)}
      />

      {/* Empty state */}
      {workLogs.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
          <CheckCircle2 className="w-16 h-16 text-chartreuse/60 mx-auto mb-4" />
          <h3 className="font-host-grotesk font-bold text-2xl text-rosewood">
            All caught up 🎉
          </h3>
          <p className="font-host-grotesk text-rosewood/50 mt-2">
            No work logs are waiting for review.
          </p>
        </div>
      )}

      {/* Work log rows */}
      {workLogs.length > 0 && (
        <div className="space-y-2">
          {workLogs.map((log) => (
            <WorkLogRow
              key={log.id}
              log={log}
              isEditing={editingId === log.id}
              isActing={actionId === log.id}
              onLooksRight={() => handleLooksRight(log.id)}
              onEditStart={() => setEditingId(log.id)}
              onEditCancel={() => setEditingId(null)}
              onEditSave={(hours, reason) =>
                handleSaveEdit(log.id, hours, reason)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// CRON HEALTH PANEL
// ============================================

function CronHealthPanel({
  recentRuns,
  expanded,
  onToggle,
}: {
  recentRuns: ReconcileRunRecord[]
  expanded: boolean
  onToggle: () => void
}) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setNow(Date.now()), 0)
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [])

  const lastRun = recentRuns[0]
  const status = (() => {
    if (!lastRun) return { color: 'bg-rosewood/30', label: 'Never run' }
    if (now === null) return { color: 'bg-rosewood/30', label: 'Checking...' }
    const ageMin = (now - new Date(lastRun.ranAt).getTime()) / 60000
    if (ageMin < 30) return { color: 'bg-chartreuse', label: 'Healthy' }
    if (ageMin < 120) return { color: 'bg-amber-400', label: 'Delayed' }
    return { color: 'bg-poppy', label: 'Stale' }
  })()

  return (
    <div className="bg-white rounded-xl border border-rosewood/5 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-plaster/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.color}`} />
          <span className="font-host-grotesk text-sm text-rosewood/70">
            Cron: {status.label}
            {lastRun && (
              <span className="text-rosewood/40 ml-2">
                · last ran {formatDateTime(lastRun.ranAt)}
              </span>
            )}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-rosewood/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-rosewood/40" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-rosewood/5 p-4 space-y-2">
          {recentRuns.length === 0 ? (
            <p className="font-host-grotesk text-sm text-rosewood/40">
              No runs recorded yet.
            </p>
          ) : (
            recentRuns.map((run, i) => (
              <div
                key={`${run.ranAt}-${i}`}
                className="flex flex-wrap items-center gap-3 text-xs font-host-grotesk text-rosewood/60"
              >
                <span className="text-rosewood/40">
                  {formatDateTime(run.ranAt)}
                </span>
                {run.dryRun && (
                  <span className="bg-plaster px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    DRY RUN
                  </span>
                )}
                <span>No-shows: {run.noShowCount}</span>
                <span>Auto-closed: {run.autoClosedCount}</span>
                <span>Backfilled: {run.backfilledCount}</span>
                {run.errors.length > 0 && (
                  <span className="text-poppy font-semibold">
                    {run.errors.length} error
                    {run.errors.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// WORK LOG ROW
// ============================================

function WorkLogRow({
  log,
  isEditing,
  isActing,
  onLooksRight,
  onEditStart,
  onEditCancel,
  onEditSave,
}: {
  log: WorkLog
  isEditing: boolean
  isActing: boolean
  onLooksRight: () => void
  onEditStart: () => void
  onEditCancel: () => void
  onEditSave: (hours: number, reason: string) => void
}) {
  const [editHours, setEditHours] = useState(String(log.hoursWorked))
  const [editReason, setEditReason] = useState('')

  const roleLabel = getRoleLabel(log.role)

  return (
    <div className="bg-white rounded-xl border border-rosewood/5 shadow-sm p-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        {/* Left: identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-host-grotesk font-bold text-rosewood">
              {log.staffName}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosewood/10 text-rosewood/60">
              {roleLabel}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-chartreuse/20 text-cypress">
              auto-closed
            </span>
          </div>
          <p className="font-host-grotesk text-sm text-rosewood/60 mt-0.5 truncate">
            {log.eventName}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-rosewood/50 font-host-grotesk">
            <span>In: {formatDateTime(log.checkInTime)}</span>
            <span>Out: {formatDateTime(log.checkOutTime)}</span>
            <span>Scheduled end: {formatDateTime(log.shiftEnd)}</span>
          </div>
        </div>

        {/* Right: numbers */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="font-host-grotesk text-xs text-rosewood/40">
              Hours
            </p>
            <p className="font-host-grotesk font-bold text-rosewood">
              {log.hoursWorked.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-host-grotesk text-xs text-rosewood/40">
              Amount
            </p>
            <p className="font-host-grotesk font-bold text-rosewood">
              {formatCurrency(log.amountOwed)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions or editor */}
      {!isEditing ? (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-rosewood/5">
          <button
            onClick={onLooksRight}
            disabled={isActing}
            className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-lg font-host-grotesk font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isActing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Looks right
          </button>
          <button
            onClick={onEditStart}
            disabled={isActing}
            className="bg-plaster hover:bg-plaster/80 text-rosewood/70 px-4 py-2 rounded-lg font-host-grotesk font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit hours
          </button>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-rosewood/5 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/40 block mb-1">
                Hours worked
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
                className="w-full px-3 py-2 bg-plaster/40 border border-rosewood/15 rounded-lg font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/40 block mb-1">
                Reason (required)
              </label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. Staff worked until 3am — confirmed via text"
                className="w-full px-3 py-2 bg-plaster/40 border border-rosewood/15 rounded-lg font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const n = parseFloat(editHours)
                if (Number.isNaN(n) || n < 0) {
                  alert('Hours must be a non-negative number')
                  return
                }
                if (editReason.trim() === '') {
                  alert('A reason is required')
                  return
                }
                onEditSave(n, editReason.trim())
              }}
              disabled={isActing}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-lg font-host-grotesk font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isActing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save & mark reviewed
            </button>
            <button
              onClick={onEditCancel}
              disabled={isActing}
              className="bg-rosewood/10 hover:bg-rosewood/20 text-rosewood/60 px-4 py-2 rounded-lg font-host-grotesk font-semibold text-xs transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}