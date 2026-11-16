// app/staff/(app)/change-password/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must differ from current password')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/staff/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error || 'Failed to change password')
        return
      }
      setSuccess(true)
      // Give the user a beat to read "Password updated", then bounce
      // to the dashboard. router.replace so back doesn't return here.
      window.setTimeout(() => {
        router.replace('/staff/dashboard')
        router.refresh()
      }, 1200)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-plaster p-4 sm:p-6 lg:p-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-rosewood/10 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-chartreuse/15 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-cypress" />
          </div>
          <h1 className="font-host-grotesk font-bold text-2xl text-rosewood mb-1">
            Change your password
          </h1>
          <p className="font-host-grotesk text-sm text-rosewood/60 mb-6">
            Your password was set by an admin. Choose a new one to continue.
          </p>

          {success ? (
            <div className="bg-chartreuse/10 border border-chartreuse/30 rounded-xl p-4 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-cypress shrink-0 mt-0.5" />
              <p className="font-host-grotesk text-sm text-cypress">
                Password updated. Redirecting...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-poppy/10 border border-poppy/30 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-poppy shrink-0 mt-0.5" />
                  <p className="font-host-grotesk text-sm text-poppy">{error}</p>
                </div>
              )}

              <PasswordField
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={show}
                disabled={submitting}
              />
              <PasswordField
                label="New password (min 8 characters)"
                value={newPassword}
                onChange={setNewPassword}
                show={show}
                disabled={submitting}
              />
              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={show}
                disabled={submitting}
              />

              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="text-xs font-host-grotesk text-rosewood/50 hover:text-rosewood transition-colors flex items-center gap-1"
              >
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {show ? 'Hide passwords' : 'Show passwords'}
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-chartreuse hover:bg-chartreuse/90 text-grove font-host-grotesk font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Update password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  disabled: boolean
}) {
  return (
    <div>
      <label className="block font-host-grotesk text-xs font-semibold uppercase tracking-wider text-rosewood/50 mb-1.5">
        {label}
      </label>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
        autoComplete="off"
        className="w-full px-3 py-2.5 bg-plaster/40 border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:bg-white transition-all disabled:opacity-50"
      />
    </div>
  )
}