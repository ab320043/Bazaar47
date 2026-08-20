'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Invalid credentials')
      }
    } catch (error) {
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-plaster flex items-center justify-center p-4">
      {/* Background with overlay */}
      <div className="absolute inset-0 opacity-10">
        <Image
          src={overlay}
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-rosewood/5">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-rosewood rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-plaster font-host-grotesk-narrow font-bold text-2xl">B47</span>
            </div>
            <h1 className="font-host-grotesk font-bold text-2xl text-rosewood">
              Admin Login
            </h1>
            <p className="font-host-grotesk text-rosewood/40 text-sm mt-1">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rosewood/30" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rosewood/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-plaster/30 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-poppy/10 border border-poppy/20 rounded-xl p-3">
                <p className="text-poppy text-sm font-host-grotesk text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rosewood hover:bg-chartreuse text-plaster hover:text-grove font-host-grotesk font-bold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Sign In'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-host-grotesk text-xs text-rosewood/30">
              Secure admin area • Bazaar47
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}