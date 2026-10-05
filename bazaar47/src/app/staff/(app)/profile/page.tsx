// app/staff/(app)/profile/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Save,
  CheckCircle2,
  Loader2,
  Lock,
  AlertCircle,
} from 'lucide-react'
import type { StaffMember } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// HELPERS
// ============================================

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function roleLabel(roleId: string): string {
  const role = STAFF_ROLES.find((r) => r.id === roleId)
  return role?.label || roleId
}

// ============================================
// MAIN
// ============================================

export default function StaffProfilePage() {
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/staff/profile')
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/staff/login'
          return
        }
        setError('Failed to load profile')
        return
      }
      const body = await res.json()
      setStaff(body.staff)
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProfile()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchProfile])

  // ---- LOADING ----

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <div className="text-rosewood/60 font-host-grotesk">Loading profile...</div>
      </div>
    )
  }

  // ---- ERROR ----

  if (error || !staff) {
    return (
      <div className="p-6 lg:p-10">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">
          ⚠️ Error
        </div>
        <div className="text-rosewood/60 font-host-grotesk">
          {error || 'No profile available'}
        </div>
        <button
          onClick={fetchProfile}
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const displayName = staff.preferredName?.trim() || staff.name

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-4xl mx-auto">

      {/* Page title */}
      <div className="mb-6">
        <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
          Profile
        </h1>
        <p className="font-host-grotesk text-rosewood/50 text-sm mt-0.5">
          Your personal information
        </p>
      </div>

      {/* Header card — avatar + name + role */}
      <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full bg-rosewood text-plaster flex items-center justify-center font-host-grotesk font-bold text-2xl shrink-0"
            aria-hidden="true"
          >
            {initialsFor(displayName)}
          </div>
          <div className="min-w-0">
            <h2 className="font-host-grotesk font-bold text-2xl text-rosewood truncate">
              {displayName}
            </h2>
            <p className="font-host-grotesk text-rosewood/60 text-sm">
              {roleLabel(staff.primaryRole)} · {staff.position}
            </p>
            <p className="font-host-grotesk text-rosewood/40 text-xs mt-1">
              {staff.email}
            </p>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-6 mb-6">
        <div className="mb-5">
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
            Editable
          </h3>
          <p className="font-host-grotesk text-rosewood/50 text-sm mt-0.5">
            Changes save automatically when you leave a field.
          </p>
        </div>

        <div className="space-y-5">
          <EditableField
            staffId={staff.id}
            field="name"
            label="Full name"
            value={staff.name}
            onSaved={(v) => setStaff({ ...staff, name: v })}
            required
          />
          <EditableField
            staffId={staff.id}
            field="preferredName"
            label="Preferred name"
            value={staff.preferredName || ''}
            placeholder="How should we address you?"
            onSaved={(v) => setStaff({ ...staff, preferredName: v })}
          />
          <EditableField
            staffId={staff.id}
            field="pronouns"
            label="Pronouns"
            value={staff.pronouns || ''}
            placeholder="e.g. she/her, they/them"
            onSaved={(v) => setStaff({ ...staff, pronouns: v })}
          />
          <EditableField
            staffId={staff.id}
            field="phone"
            label="Phone"
            value={staff.phone}
            onSaved={(v) => setStaff({ ...staff, phone: v })}
            required
            inputType="tel"
          />
          <EditableField
            staffId={staff.id}
            field="instagram"
            label="Instagram"
            value={staff.instagram || ''}
            placeholder="yourhandle"
            onSaved={(v) => setStaff({ ...staff, instagram: v })}
            prefix="@"
          />
          <EditableField
            staffId={staff.id}
            field="bio"
            label="Bio"
            value={staff.bio || ''}
            placeholder="A short note about you — what you do, what you care about."
            onSaved={(v) => setStaff({ ...staff, bio: v })}
            multiline
          />
        </div>
      </div>

      {/* Emergency contact */}
      <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-6 mb-6">
        <div className="mb-5">
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
            Emergency Contact
          </h3>
          <p className="font-host-grotesk text-rosewood/50 text-sm mt-0.5">
            Who should we reach if something happens during a shift?
          </p>
        </div>

        <div className="space-y-5">
          <EditableField
            staffId={staff.id}
            field="emergencyContactName"
            label="Contact name"
            value={staff.emergencyContactName || ''}
            placeholder="Full name"
            onSaved={(v) => setStaff({ ...staff, emergencyContactName: v })}
          />
          <EditableField
            staffId={staff.id}
            field="emergencyContactPhone"
            label="Contact phone"
            value={staff.emergencyContactPhone || ''}
            placeholder="(352) 123-4567"
            onSaved={(v) => setStaff({ ...staff, emergencyContactPhone: v })}
            inputType="tel"
          />
        </div>
      </div>

      {/* Read-only fields */}
      <div className="bg-plaster/50 rounded-2xl border border-rosewood/10 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-rosewood/50" />
          <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
            Managed by admin
          </h3>
        </div>
        <p className="font-host-grotesk text-rosewood/50 text-sm mb-4">
          Contact an admin if any of this needs to change.
        </p>

        <div className="space-y-3">
          <ReadOnlyField
            label="Email"
            value={staff.email}
            hint="Used for sign-in. Ask an admin to change it."
          />
          <ReadOnlyField label="Role" value={roleLabel(staff.primaryRole)} />
          <ReadOnlyField label="Position" value={staff.position} />
          <ReadOnlyField
            label="Hourly rate"
            value={`$${staff.hourlyRate.toFixed(2)}/hr`}
          />
          <ReadOnlyField
            label="Nonprofit rate"
            value={`$${staff.nonprofitRate.toFixed(2)}/hr`}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================
// EDITABLE FIELD
// ============================================

function EditableField({
  staffId,
  field,
  label,
  value,
  placeholder,
  onSaved,
  required,
  multiline,
  inputType = 'text',
  prefix,
  prefixIcon,
}: {
  staffId: string
  field: string
  label: string
  value: string
  placeholder?: string
  onSaved: (value: string) => void
  required?: boolean
  multiline?: boolean
  inputType?: 'text' | 'tel' | 'email'
  prefix?: string
  prefixIcon?: React.ReactNode
}) {
  const [local, setLocal] = useState(value)
  const [lastSaved, setLastSaved] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  // Synchronize editable state when the saved value changes externally.
  if (value !== previousValue) {
    setPreviousValue(value)
    setLocal(value)
    setLastSaved(value)
  }

  const handleBlur = async () => {
    setFieldError(null)

    if (local === lastSaved) return
    if (required && local.trim() === '') {
      setFieldError('This field is required')
      setLocal(lastSaved)
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/staff/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: local }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setFieldError(body.error || 'Failed to save')
        setLocal(lastSaved)
        return
      }
      setLastSaved(local)
      onSaved(local)
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 2000)
    } catch {
      setFieldError('Network error')
      setLocal(lastSaved)
    } finally {
      setIsSaving(false)
    }
  }

  const inputClasses =
    'w-full px-4 py-2.5 bg-plaster/40 border border-rosewood/15 rounded-xl font-host-grotesk text-sm text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 focus:bg-white transition-all'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-host-grotesk font-semibold text-sm text-rosewood/80">
          {label}
          {required && <span className="text-poppy ml-0.5">*</span>}
        </label>
        <div className="flex items-center gap-1.5 text-xs">
          {isSaving && (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-rosewood/40" />
              <span className="font-host-grotesk text-rosewood/40">Saving...</span>
            </>
          )}
          {justSaved && !isSaving && (
            <>
              <CheckCircle2 className="w-3 h-3 text-chartreuse" />
              <span className="font-host-grotesk text-chartreuse">Saved</span>
            </>
          )}
        </div>
      </div>

      {multiline ? (
        <textarea
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={handleBlur}
          rows={3}
          placeholder={placeholder}
          className={`${inputClasses} resize-none`}
        />
      ) : prefix ? (
        <div className="flex items-center gap-0">
          <span className="flex items-center gap-1 px-3 py-2.5 bg-plaster/60 border border-r-0 border-rosewood/15 rounded-l-xl font-host-grotesk text-sm text-rosewood/50">
            {prefixIcon}
            {prefix}
          </span>
          <input
            type={inputType}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`${inputClasses} rounded-l-none`}
          />
        </div>
      ) : (
        <input
          type={inputType}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}

      {fieldError && (
        <p className="font-host-grotesk text-xs text-poppy mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {fieldError}
        </p>
      )}
    </div>
  )
}

// ============================================
// READ-ONLY FIELD
// ============================================

function ReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div>
        <p className="font-host-grotesk text-sm text-rosewood/50">{label}</p>
        {hint && (
          <p className="font-host-grotesk text-xs text-rosewood/40 mt-0.5">
            {hint}
          </p>
        )}
      </div>
      <p className="font-host-grotesk text-sm font-semibold text-rosewood text-right">
        {value}
      </p>
    </div>
  )
}