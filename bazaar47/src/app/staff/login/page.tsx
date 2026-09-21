// app/staff/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Mail, ArrowRight, AlertCircle, UserCog } from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'

export default function StaffLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // If already authenticated, jump straight to the dashboard.
  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/staff/me')
        if (!cancelled && response.ok) {
          window.location.href = '/staff/dashboard'
          return
        }
      } catch {
        // Not logged in — fall through to showing the form.
      } finally {
        if (!cancelled) setIsCheckingAuth(false)
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Hard redirect so the server re-renders with the session cookie.
        window.location.href = data.redirect || '/staff/dashboard'
      } else {
        setError(data.error || 'Invalid email or password')
      }
    } catch (err) {
      console.error('Staff login error:', err)
      setError('Network error — please check your connection')
    } finally {
      setLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-rosewood flex items-center justify-center">
        <div className="text-plaster/60 font-host-grotesk">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-rosewood flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 opacity-10">
        <Image src={overlay} alt="" fill className="object-cover" priority />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-plaster rounded-3xl shadow-2xl p-8 md:p-10 border border-plaster/10">
          <div className="text-center mb-8">
            {/* Staff badge — chartreuse, distinct from admin's rosewood B47 */}
            <div className="w-16 h-16 bg-chartreuse rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserCog className="w-8 h-8 text-grove" />
            </div>
            <p className="font-host-grotesk text-[10px] uppercase tracking-[0.3em] font-bold text-grove/40 mb-1">
              Staff Portal
            </p>
            <h1 className="font-host-grotesk font-bold text-2xl text-grove">
              Sign In
            </h1>
            <p className="font-host-grotesk text-grove/40 text-sm mt-1">
              View your shifts and clock in / out
            </p>
          </div>

          {error && (
            <div className="bg-poppy/10 border border-poppy/20 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-poppy shrink-0 mt-0.5" />
              <p className="text-poppy text-sm font-host-grotesk">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-grove/80 block mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grove/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-sand-dune/20 border border-grove/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/60 font-host-grotesk text-grove transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="font-host-grotesk font-semibold text-sm text-grove/80 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grove/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 bg-sand-dune/20 border border-grove/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/60 font-host-grotesk text-grove transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-grove hover:bg-chartreuse text-plaster hover:text-grove font-host-grotesk font-bold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-plaster/30 border-t-plaster rounded-full" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-grove/10 text-center space-y-2">
            <p className="font-host-grotesk text-xs text-grove/30">
              Staff area • Bazaar47
            </p>
            <Link
              href="/login"
              className="font-host-grotesk text-xs text-grove/40 hover:text-grove transition-colors inline-block"
            >
              Are you an admin? Sign in here →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}