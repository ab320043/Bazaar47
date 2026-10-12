// app/open-mic/page.tsx
'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Mic2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'

// ============================================
// TYPES + HELPERS
// ============================================

interface FormState {
  fullName: string
  artistName: string
  genre: string
  musicLink: string
  instagram: string
  email: string
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | {
      kind: 'success'
      artistName: string
      confirmationNumber: string
      sessionLabel: string
    }
  | { kind: 'error'; message: string }

const FIRST_SESSION = new Date(2026, 9, 21) // Oct 21, 2026

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function formatLong(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Computes the current session state on the client. Mirrors the server
 * logic in lib/open-mic/sessions.ts.
 *
 * Special case: before Oct 21, 2026, the first session is OPEN.
 */
function computeSessionState(now: Date = new Date()): {
  state: 'open' | 'closed' | 'not-yet-started'
  nextSessionLabel: string
  nextSessionOpensLabel: string
  upcomingSessionLabel: string
} {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Before the first session: first session is open for early sign-ups
  if (today.getTime() < FIRST_SESSION.getTime()) {
    const firstLabel = formatLong(FIRST_SESSION)
    return {
      state: 'open',
      nextSessionLabel: firstLabel,
      nextSessionOpensLabel: 'Today',
      upcomingSessionLabel: firstLabel,
    }
  }

  const dow = today.getDay() // 0=Sun, 3=Wed

  // Next session Wednesday
  const offset = dow === 3 ? 7 : (3 - dow + 7) % 7
  const wed = new Date(today)
  wed.setDate(today.getDate() + offset)

  // Opens Thursday, 7 days before session
  const opens = new Date(wed)
  opens.setDate(wed.getDate() - 7)

  // Closes Tuesday, day before session
  const closes = new Date(wed)
  closes.setDate(wed.getDate() - 1)

  const inOpenWindow =
    today.getTime() >= opens.getTime() && today.getTime() <= closes.getTime()

  const sessionLabel = formatLong(wed)
  const opensLabel = formatLong(opens)

  // On Wednesdays: closed; point at next week
  if (dow === 3) {
    const nextWed = new Date(today)
    nextWed.setDate(today.getDate() + 7)
    const nextOpens = new Date(nextWed)
    nextOpens.setDate(nextWed.getDate() - 6)
    return {
      state: 'closed',
      nextSessionLabel: formatLong(nextWed),
      nextSessionOpensLabel: formatLong(nextOpens),
      upcomingSessionLabel: formatLong(nextWed),
    }
  }

  if (!inOpenWindow) {
    return {
      state: 'closed',
      nextSessionLabel: sessionLabel,
      nextSessionOpensLabel: opensLabel,
      upcomingSessionLabel: sessionLabel,
    }
  }

  return {
    state: 'open',
    nextSessionLabel: sessionLabel,
    nextSessionOpensLabel: opensLabel,
    upcomingSessionLabel: sessionLabel,
  }
}

// ============================================
// PAGE
// ============================================

export default function OpenMicPage() {
  const session = useMemo(() => computeSessionState(), [])

  const [form, setForm] = useState<FormState>({
    fullName: '',
    artistName: '',
    genre: '',
    musicLink: '',
    instagram: '',
    email: '',
  })
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    if (name === 'instagram') {
      setForm((prev) => ({ ...prev, [name]: value.replace(/^@+/, '') }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.fullName.trim()) {
      setSubmitState({ kind: 'error', message: 'Please enter your full name' })
      return
    }
    if (!form.artistName.trim()) {
      setSubmitState({
        kind: 'error',
        message: 'Please enter your artist name',
      })
      return
    }
    if (!form.genre.trim()) {
      setSubmitState({ kind: 'error', message: 'Please pick a genre' })
      return
    }
    if (!isValidEmail(form.email)) {
      setSubmitState({ kind: 'error', message: 'Please enter a valid email' })
      return
    }

    setSubmitState({ kind: 'submitting' })

    try {
      const instagramDisplay = form.instagram.trim()
        ? `@${form.instagram.trim()}`
        : undefined

      const res = await fetch('/api/open-mic/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          artistName: form.artistName.trim(),
          genre: form.genre.trim(),
          musicLink: form.musicLink.trim() || undefined,
          instagram: instagramDisplay,
          email: form.email.trim(),
        }),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setSubmitState({
          kind: 'error',
          message: body.error || 'Something went wrong. Please try again.',
        })
        return
      }

      setSubmitState({
        kind: 'success',
        artistName: form.artistName.trim(),
        confirmationNumber: body.confirmationNumber,
        sessionLabel: session.upcomingSessionLabel,
      })
    } catch (err) {
      console.error('Open Mic submit error:', err)
      setSubmitState({
        kind: 'error',
        message: 'Network error — please try again.',
      })
    }
  }

  const handleReset = () => {
    setForm({
      fullName: '',
      artistName: '',
      genre: '',
      musicLink: '',
      instagram: '',
      email: '',
    })
    setSubmitState({ kind: 'idle' })
  }

  return (
    <div className="relative min-h-screen bg-grove">
      {/* Overlay */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <Image src={overlay} alt="" fill className="object-cover" priority />
      </div>

      {/* Decorative blur */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-chartreuse/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rosewood/30 rounded-full blur-3xl" />
      </div>

      {/* Back */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-plaster/70 hover:text-plaster transition-colors font-host-grotesk text-sm group bg-grove/60 backdrop-blur-sm px-4 py-2 rounded-full border border-plaster/10"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </Link>
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 py-20 md:py-28 max-w-3xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-8 h-px bg-chartreuse/60" />
            <span className="font-host-grotesk text-[10px] sm:text-xs text-chartreuse/80 uppercase tracking-[0.3em] font-bold flex items-center gap-2">
              <Mic2 className="w-3 h-3" />
              Every Wednesday
              <Mic2 className="w-3 h-3" />
            </span>
            <span className="w-8 h-px bg-chartreuse/60" />
          </div>

          <h1 className="font-host-grotesk-narrow font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-plaster leading-[0.95]">
            Open Mic
          </h1>
          <p className="font-host-grotesk text-lg sm:text-xl md:text-2xl text-chartreuse mt-3 font-semibold">
            ✦ Bring your sound to the circle ✦
          </p>

          <p className="font-host-grotesk text-sm sm:text-base text-plaster/70 mt-6 max-w-xl mx-auto">
            Music, poetry, spoken word, art — the stage is yours. Sign up
            below to claim your spot at the next session.
          </p>
        </motion.div>

        {/* Session snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10"
        >
          <div className="flex flex-col items-center text-center p-5 bg-plaster/5 rounded-2xl border border-plaster/10 backdrop-blur-sm">
            <Calendar className="w-5 h-5 text-chartreuse mb-2" />
            <span className="font-host-grotesk text-[10px] text-plaster/50 uppercase tracking-wider">
              Next Session
            </span>
            <span className="font-host-grotesk font-bold text-plaster text-sm mt-1 text-center">
              {session.upcomingSessionLabel}
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-5 bg-plaster/5 rounded-2xl border border-plaster/10 backdrop-blur-sm">
            <Clock className="w-5 h-5 text-chartreuse mb-2" />
            <span className="font-host-grotesk text-[10px] text-plaster/50 uppercase tracking-wider">
              Doors
            </span>
            <span className="font-host-grotesk font-bold text-plaster text-sm mt-1">
              8:00 PM – 10:00 PM
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-5 bg-plaster/5 rounded-2xl border border-plaster/10 backdrop-blur-sm">
            <MapPin className="w-5 h-5 text-chartreuse mb-2" />
            <span className="font-host-grotesk text-[10px] text-plaster/50 uppercase tracking-wider">
              Where
            </span>
            <span className="font-host-grotesk font-bold text-plaster text-sm mt-1 text-center">
              Bazaar47 · 60 SW 2nd St
            </span>
          </div>
        </motion.div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {session.state === 'not-yet-started' && (
            <div className="rounded-3xl p-8 bg-plaster/5 border border-plaster/15 text-center">
              <Sparkles className="w-10 h-10 text-chartreuse mx-auto mb-4" />
              <h3 className="font-host-grotesk font-bold text-xl text-plaster mb-2">
                Open Mic starts soon
              </h3>
              <p className="font-host-grotesk text-plaster/70">
                First session: {session.upcomingSessionLabel}. Sign-ups open
                the Thursday before.
              </p>
            </div>
          )}

          {session.state === 'closed' && (
            <div className="rounded-3xl p-8 bg-plaster/5 border border-plaster/15 text-center">
              <Clock className="w-10 h-10 text-chartreuse mx-auto mb-4" />
              <h3 className="font-host-grotesk font-bold text-xl text-plaster mb-2">
                Submissions are closed
              </h3>
              <p className="font-host-grotesk text-plaster/70 max-w-md mx-auto">
                Next session: <strong className="text-plaster">{session.nextSessionLabel}</strong>.{' '}
                Sign-ups open {session.nextSessionOpensLabel}.
              </p>
            </div>
          )}

          {session.state === 'open' && (
            <AnimatePresence mode="wait">
              {submitState.kind === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-plaster rounded-3xl p-6 sm:p-8 border border-plaster/10 shadow-2xl"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-chartreuse/20 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-cypress" />
                    </div>
                    <h2 className="font-host-grotesk font-bold text-2xl text-rosewood">
                      You&apos;re on, {submitState.artistName}!
                    </h2>
                    <p className="font-host-grotesk text-rosewood/60 mt-2 max-w-md">
                      We&apos;ll see you at{' '}
                      <strong>{submitState.sessionLabel}</strong>. Check your
                      email for confirmation.
                    </p>
                    <p className="font-host-grotesk text-xs text-rosewood/40 mt-4 font-mono">
                      Confirmation #{submitState.confirmationNumber}
                    </p>
                    <button
                      onClick={handleReset}
                      className="mt-6 bg-rosewood hover:bg-rosewood/90 text-plaster font-host-grotesk font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Sign up another artist
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="bg-plaster rounded-3xl p-6 sm:p-8 border border-plaster/10 shadow-2xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-rosewood/60" />
                    <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                      Sign up to perform
                    </h3>
                  </div>
                  <p className="font-host-grotesk text-sm text-rosewood/60 mb-6">
                    Reserving your spot for <strong>{session.upcomingSessionLabel}</strong>.
                    Submissions close Tuesday at 11:59 PM.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Full name <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                        autoComplete="name"
                        className="w-full px-4 py-3 bg-white border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 font-host-grotesk text-rosewood transition-all"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Artist name <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="artistName"
                        value={form.artistName}
                        onChange={handleChange}
                        required
                        autoComplete="off"
                        className="w-full px-4 py-3 bg-white border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 font-host-grotesk text-rosewood transition-all"
                        placeholder="What should we call you on the mic?"
                      />
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Music genre <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="genre"
                        value={form.genre}
                        onChange={handleChange}
                        required
                        autoComplete="off"
                        className="w-full px-4 py-3 bg-white border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 font-host-grotesk text-rosewood transition-all"
                        placeholder="e.g. Indie, Hip-Hop, Jazz, Poetry…"
                      />
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Link to Music
                      </label>
                      <input
                        type="url"
                        name="musicLink"
                        value={form.musicLink}
                        onChange={handleChange}
                        autoComplete="off"
                        className="w-full px-4 py-3 bg-white border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 font-host-grotesk text-rosewood transition-all"
                        placeholder="https://soundcloud.com/you — optional"
                      />
                      <p className="font-host-grotesk text-xs text-rosewood/40 mt-1">
                        Optional. Share a link to your music, Spotify, SoundCloud,
                        Bandcamp, YouTube — whatever you want us to hear.
                      </p>
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Instagram handle
                      </label>
                      <div className="flex items-center">
                        <span className="px-4 py-3 bg-white border border-r-0 border-rosewood/15 rounded-l-xl font-host-grotesk text-rosewood/50">
                          @
                        </span>
                        <input
                          type="text"
                          name="instagram"
                          value={form.instagram}
                          onChange={handleChange}
                          autoComplete="off"
                          className="flex-1 px-4 py-3 bg-white border border-rosewood/15 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 font-host-grotesk text-rosewood transition-all"
                          placeholder="yourhandle"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Email <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        className="w-full px-4 py-3 bg-white border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 font-host-grotesk text-rosewood transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {submitState.kind === 'error' && (
                    <div className="mt-4 bg-poppy/10 border border-poppy/20 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-poppy shrink-0 mt-0.5" />
                      <p className="text-poppy text-sm font-host-grotesk">
                        {submitState.message}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitState.kind === 'submitting'}
                    className="mt-6 w-full bg-rosewood hover:bg-chartreuse text-plaster hover:text-grove font-host-grotesk font-bold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submitState.kind === 'submitting' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Sign Up
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-center font-host-grotesk text-xs text-rosewood/40 mt-4">
                    Free to perform · All genres welcome
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center font-host-grotesk text-xs text-plaster/30 mt-10">
          Bazaar47 · 60 SW 2nd Street, Gainesville, FL
        </p>
      </div>
    </div>
  )
}