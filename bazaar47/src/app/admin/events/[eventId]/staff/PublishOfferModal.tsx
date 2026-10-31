// app/admin/events/[eventId]/staff/PublishOfferModal.tsx
'use client'

import { useState, useMemo } from 'react'
import { X, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { ShiftOffer } from '@/types/shift-offer'
import { STAFF_ROLES, getRateForRole } from '@/data/staff-roles'
import type { StaffRole, EventType } from '@/types/staff'

// ============================================
// TYPES
// ============================================

interface PublishOfferModalProps {
  eventId: string
  eventName: string
  eventDate: string
  eventType: EventType
  defaultShiftStart: string
  defaultShiftEnd: string
  onClose: () => void
  onPublished: (offer: ShiftOffer) => void
}

// ============================================
// HELPERS
// ============================================

function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ============================================
// COMPONENT
// ============================================

export function PublishOfferModal({
  eventId,
  eventName,
  eventDate,
  eventType,
  defaultShiftStart,
  defaultShiftEnd,
  onClose,
  onPublished,
}: PublishOfferModalProps) {
  const [role, setRole] = useState<StaffRole>('bartender')
  const [slotsNeeded, setSlotsNeeded] = useState('1')
  const [shiftStart, setShiftStart] = useState(
    toLocalDatetimeInput(defaultShiftStart)
  )
  const [shiftEnd, setShiftEnd] = useState(
    toLocalDatetimeInput(defaultShiftEnd)
  )
  const [hourlyRate, setHourlyRate] = useState(
    String(getRateForRole('bartender', eventType))
  )
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [minNoticeHours, setMinNoticeHours] = useState('0')
  const [whoCanClaim, setWhoCanClaim] = useState('all')
  const [graceHours, setGraceHours] = useState('1')
  const [noShowMinutes, setNoShowMinutes] = useState('30')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableRoles = useMemo(
    () => STAFF_ROLES.filter((r) => r.eventTiers.includes(eventType)),
    [eventType]
  )

  const handleRoleChange = (newRole: StaffRole) => {
    setRole(newRole)
    setHourlyRate(String(getRateForRole(newRole, eventType)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const slotsNum = parseInt(slotsNeeded, 10)
    if (!Number.isInteger(slotsNum) || slotsNum < 1) {
      setError('Slots must be at least 1')
      return
    }
    const startMs = new Date(shiftStart).getTime()
    const endMs = new Date(shiftEnd).getTime()
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      setError('Invalid shift times')
      return
    }
    if (endMs <= startMs) {
      setError('Shift end must be after start')
      return
    }
    const rateNum = parseFloat(hourlyRate)
    if (Number.isNaN(rateNum) || rateNum <= 0) {
      setError('Rate must be greater than zero')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        eventId,
        eventName,
        eventDate,
        role,
        slotsNeeded: slotsNum,
        shiftStart: new Date(shiftStart).toISOString(),
        shiftEnd: new Date(shiftEnd).toISOString(),
        hourlyRate: rateNum,
      }

      if (showAdvanced) {
        body.minNoticeHours = parseInt(minNoticeHours, 10) || 0
        body.whoCanClaim = whoCanClaim
        body.graceHours = parseInt(graceHours, 10) || 1
        body.noShowMinutes = parseInt(noShowMinutes, 10) || 30
      }

      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to publish offer')
        return
      }

      onPublished(data.offer as ShiftOffer)
      onClose()
    } catch (err) {
      setError('Network error — please try again')
      console.error('Publish offer error:', err)
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
              Publish offer
            </h3>
            <p className="font-host-grotesk text-sm text-rosewood/50 mt-0.5">
              {eventName}
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
          {/* Role */}
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
              className="w-full px-4 py-2.5 bg-plaster/30 border border-rosewood/15 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:bg-white"
            >
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.icon} {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Slots + rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                Slots needed
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={slotsNeeded}
                onChange={(e) => setSlotsNeeded(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-plaster/30 border border-rosewood/15 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:bg-white"
              />
            </div>
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                Rate ($/hr)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-plaster/30 border border-rosewood/15 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:bg-white"
              />
            </div>
          </div>

          {/* Shift window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                Start
              </label>
              <input
                type="datetime-local"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-plaster/30 border border-rosewood/15 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:bg-white"
              />
            </div>
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                End
              </label>
              <input
                type="datetime-local"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-plaster/30 border border-rosewood/15 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:bg-white"
              />
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-host-grotesk font-semibold text-rosewood/50 hover:text-rosewood transition-colors"
          >
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            {showAdvanced ? 'Hide advanced' : 'Show advanced'}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pl-2 border-l-2 border-rosewood/10">
              <div>
                <label className="font-host-grotesk font-semibold text-xs text-rosewood/70 block mb-1">
                  Who can claim
                </label>
                <select
                  value={whoCanClaim}
                  onChange={(e) => setWhoCanClaim(e.target.value)}
                  className="w-full px-3 py-2 bg-plaster/30 border border-rosewood/15 rounded-lg font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
                >
                  <option value="all">All staff</option>
                  <option value="permanent">Permanent only</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-host-grotesk font-semibold text-xs text-rosewood/70 block mb-1">
                    Notice (h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minNoticeHours}
                    onChange={(e) => setMinNoticeHours(e.target.value)}
                    className="w-full px-2 py-1.5 bg-plaster/30 border border-rosewood/15 rounded-lg font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
                  />
                </div>
                <div>
                  <label className="font-host-grotesk font-semibold text-xs text-rosewood/70 block mb-1">
                    Grace (h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={graceHours}
                    onChange={(e) => setGraceHours(e.target.value)}
                    className="w-full px-2 py-1.5 bg-plaster/30 border border-rosewood/15 rounded-lg font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
                  />
                </div>
                <div>
                  <label className="font-host-grotesk font-semibold text-xs text-rosewood/70 block mb-1">
                    No-show (m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={noShowMinutes}
                    onChange={(e) => setNoShowMinutes(e.target.value)}
                    className="w-full px-2 py-1.5 bg-plaster/30 border border-rosewood/15 rounded-lg font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40"
                  />
                </div>
              </div>
            </div>
          )}

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
              Publish offer
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