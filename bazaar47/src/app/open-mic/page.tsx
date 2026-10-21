// app/open-mic/page.tsx
'use client'

import { useState } from 'react'
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
    }
  | { kind: 'error'; message: string }

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

// ============================================
// PAGE
// ============================================

export default function OpenMicPage() {
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
        confirmationNumber: body.id ? `OM-${body.id.slice(0, 6).toUpperCase()}` : 'Confirmed',
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
            ✦ Bring your sound to the Stage ✦
          </p>

          <p className="font-host-grotesk text-sm sm:text-base text-plaster/70 mt-6 max-w-xl mx-auto">
            Music, poetry, spoken word, art — the stage is yours. Sign up
            below to join our artist pool.
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
              When
            </span>
            <span className="font-host-grotesk font-bold text-plaster text-sm mt-1 text-center">
              Every Wednesday
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
                    You&apos;re in the pool, {submitState.artistName}!
                  </h2>
                  <p className="font-host-grotesk text-rosewood/60 mt-2 max-w-md">
                    We&apos;ve received your submission. Our team will review it and reach out with your scheduled performance time.
                  </p>
                  <p className="font-host-grotesk text-xs text-rosewood/40 mt-4 font-mono">
                    Ref #{submitState.confirmationNumber}
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
                    Join the Artist Pool
                  </h3>
                </div>
                <p className="font-host-grotesk text-sm text-rosewood/60 mb-6">
                  Submit your details below. If selected, we&apos;ll fit you into an upcoming session.
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
                      Submit Application
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
        </motion.div>

        {/* Footer */}
        <p className="text-center font-host-grotesk text-xs text-plaster/30 mt-10">
          Bazaar47 · 60 SW 2nd Street, Gainesville, FL
        </p>
      </div>
    </div>
  )
}