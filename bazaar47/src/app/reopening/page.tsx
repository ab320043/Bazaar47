// app/reopening/page.tsx
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
  Sparkles,
  Users,
  Wine,
  Heart,
  PartyPopper,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'

// ============================================
// CONFIG
// ============================================

const EVENT = {
  title: 'Bazaar47 Grand (Re)Opening',
  subtitle: "Laila's Birthday Party",
  date: 'Thursday, October 15, 2026',
  time: '8:00 PM – 11:00 PM',
  venue: 'Bazaar47',
  address: '60 SW 2nd Street, Gainesville, FL',
  venmo: '@bazaar47',
}

const MAX_GUESTS = 10

// ============================================
// TYPES
// ============================================

interface FormState {
  fullName: string
  instagram: string
  email: string
  guestCount: string
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; name: string; orderNumber: string }
  | { kind: 'error'; message: string }

// ============================================
// HELPERS
// ============================================

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

// ============================================
// MAIN
// ============================================

export default function ReopeningPage() {
  const [form, setForm] = useState<FormState>({
    fullName: '',
    instagram: '',
    email: '',
    guestCount: '1',
  })
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'instagram') {
      // Strip leading @s — display keeps the @ prefix
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
    if (!isValidEmail(form.email)) {
      setSubmitState({ kind: 'error', message: 'Please enter a valid email' })
      return
    }
    const guestNum = parseInt(form.guestCount, 10)
    if (!Number.isInteger(guestNum) || guestNum < 1 || guestNum > MAX_GUESTS) {
      setSubmitState({
        kind: 'error',
        message: `Guest count must be between 1 and ${MAX_GUESTS}`,
      })
      return
    }

    setSubmitState({ kind: 'submitting' })

    try {
      const orderNumber = `REOPEN-${Date.now().toString(36).toUpperCase()}`
      const instagramDisplay = form.instagram.trim()
        ? `@${form.instagram.trim().replace(/^@+/, '')}`
        : ''

      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            instagram: instagramDisplay,
            guestCount: guestNum,
            eventId: 'grand-reopening',
            eventSlug: 'reopening',
            eventName: EVENT.title,
            orderNumber,
            submissionKind: 'reopening-rsvp',
          },
          type: 'rsvp',
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setSubmitState({
          kind: 'error',
          message: body.error || 'Something went wrong. Please try again.',
        })
        return
      }

      // Fire confirmation email (non-blocking)
      try {
        await fetch('/api/send-reopening-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            instagram: instagramDisplay,
            guestCount: guestNum,
            orderNumber,
          }),
        })
      } catch {
        // Non-blocking — RSVP is already saved
      }

      setSubmitState({
        kind: 'success',
        name: form.fullName.trim(),
        orderNumber,
      })
    } catch (err) {
      console.error('Reopening RSVP error:', err)
      setSubmitState({
        kind: 'error',
        message: 'Network error — please try again.',
      })
    }
  }

  const handleReset = () => {
    setForm({ fullName: '', instagram: '', email: '', guestCount: '1' })
    setSubmitState({ kind: 'idle' })
  }

  return (
    <div className="relative min-h-screen bg-rosewood">
      {/* Overlay texture */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <Image src={overlay} alt="" fill className="object-cover" priority />
      </div>

      {/* Decorative blur */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-chartreuse/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-hippie/10 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-plaster/70 hover:text-plaster transition-colors font-host-grotesk text-sm group bg-rosewood/60 backdrop-blur-sm px-4 py-2 rounded-full border border-plaster/10"
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
              <PartyPopper className="w-3 h-3" />
              Two in one
              <PartyPopper className="w-3 h-3" />
            </span>
            <span className="w-8 h-px bg-chartreuse/60" />
          </div>

          <h1 className="font-host-grotesk-narrow font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-plaster leading-[0.95]">
            {EVENT.title}
          </h1>
          <p className="font-host-grotesk text-lg sm:text-xl md:text-2xl text-chartreuse mt-3 font-semibold">
            ✦ {EVENT.subtitle} ✦
          </p>

          <p className="font-host-grotesk text-sm sm:text-base text-plaster/70 mt-6 max-w-xl mx-auto">
            Bazaar47 is back. Join us for the Grand (Re)Opening — a night of music, drinks, and community. And yes, it&apos;s also Laila&apos;s birthday.
          </p>
        </motion.div>

        {/* Event snapshot cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10"
        >
          <div className="flex flex-col items-center text-center p-5 bg-plaster/5 rounded-2xl border border-plaster/10 backdrop-blur-sm">
            <Calendar className="w-5 h-5 text-chartreuse mb-2" />
            <span className="font-host-grotesk text-[10px] text-plaster/50 uppercase tracking-wider">
              Date
            </span>
            <span className="font-host-grotesk font-bold text-plaster text-sm mt-1">
              {EVENT.date}
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-5 bg-plaster/5 rounded-2xl border border-plaster/10 backdrop-blur-sm">
            <Clock className="w-5 h-5 text-chartreuse mb-2" />
            <span className="font-host-grotesk text-[10px] text-plaster/50 uppercase tracking-wider">
              Time
            </span>
            <span className="font-host-grotesk font-bold text-plaster text-sm mt-1">
              {EVENT.time}
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-5 bg-plaster/5 rounded-2xl border border-plaster/10 backdrop-blur-sm">
            <MapPin className="w-5 h-5 text-chartreuse mb-2" />
            <span className="font-host-grotesk text-[10px] text-plaster/50 uppercase tracking-wider">
              Where
            </span>
            <span className="font-host-grotesk font-bold text-plaster text-sm mt-1 text-center">
              {EVENT.address}
            </span>
          </div>
        </motion.div>

        {/* Support the bar — marketing banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-chartreuse/20 via-chartreuse/10 to-transparent border border-chartreuse/30"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-chartreuse/30 flex items-center justify-center shrink-0">
              <Wine className="w-6 h-6 text-chartreuse" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-host-grotesk font-bold text-lg text-plaster mb-1">
                Support Bazaar47!
              </h3>
              <p className="font-host-grotesk text-sm text-plaster/70 mb-4">
                We&apos;ve been closed for a while. If you want to support Bazaar47 and help us keep the lights on, consider sending a tip or buying a drink for the team.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://venmo.com/${EVENT.venmo.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-plaster text-rosewood font-host-grotesk font-bold text-sm px-4 py-2 rounded-xl hover:bg-chartreuse hover:text-grove transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  Venmo {EVENT.venmo}
                </a>
                {/* <a
                  href={`https://cash.app/${EVENT.cashapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-plaster text-rosewood font-host-grotesk font-bold text-sm px-4 py-2 rounded-xl hover:bg-chartreuse hover:text-grove transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  Cash App {EVENT.cashapp}
                </a> */}
                <span className="inline-flex items-center gap-2 text-plaster/60 font-host-grotesk text-sm px-2 py-2">
                  or just buy a drink at the bar 🍹
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
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
                    See you there, {submitState.name.split(' ')[0] || 'friend'}!
                  </h2>
                  <p className="font-host-grotesk text-rosewood/60 mt-2 max-w-md">
                    Your RSVP is locked in. We&apos;ll have your name at the door.
                  </p>
                  <p className="font-host-grotesk text-xs text-rosewood/40 mt-4 font-mono">
                    RSVP #{submitState.orderNumber}
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-6 bg-rosewood hover:bg-rosewood/90 text-plaster font-host-grotesk font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Submit another RSVP
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
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-rosewood/60" />
                  <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                    RSVP
                  </h3>
                </div>

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

                  <div>
                    <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 mb-1.5 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      How many guests are you bringing?
                      <span className="text-poppy">*</span>
                    </label>
                    <p className="font-host-grotesk text-xs text-rosewood/50 mb-2">
                      Count yourself plus anyone coming with you (1–{MAX_GUESTS}).
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const n = parseInt(form.guestCount, 10) || 1
                          if (n > 1) {
                            setForm({ ...form, guestCount: String(n - 1) })
                          }
                        }}
                        className="w-11 h-11 rounded-xl bg-white hover:bg-chartreuse/20 text-rosewood transition-colors flex items-center justify-center border border-rosewood/15"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        name="guestCount"
                        min="1"
                        max={MAX_GUESTS}
                        value={form.guestCount}
                        onChange={handleChange}
                        required
                        className="w-20 text-center px-3 py-3 bg-white border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const n = parseInt(form.guestCount, 10) || 1
                          if (n < MAX_GUESTS) {
                            setForm({ ...form, guestCount: String(n + 1) })
                          }
                        }}
                        className="w-11 h-11 rounded-xl bg-white hover:bg-chartreuse/20 text-rosewood transition-colors flex items-center justify-center border border-rosewood/15"
                      >
                        +
                      </button>
                    </div>
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
                      RSVP
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-center font-host-grotesk text-xs text-rosewood/40 mt-4">
                  Free entry · Bring friends · Let&apos;s celebrate
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