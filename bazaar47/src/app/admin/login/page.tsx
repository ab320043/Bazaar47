'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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
        setError('Invalid username or password')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-plaster">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-rosewood/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-chartreuse/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="font-host-grotesk font-bold text-2xl text-chartreuse">B47</span>
          </div>
          <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
            Admin Login
          </h1>
          <p className="font-host-grotesk text-rosewood/50 mt-1">
            Bazaar47 Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <p className="text-poppy text-sm font-host-grotesk">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cypress hover:bg-cypress/90 text-plaster font-host-grotesk font-bold text-lg py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}