// dancer sign up form
// app/events/block-party/dance-signup/page.tsx
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Flame,
  Sparkles,
  Music2,
} from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'
import { getEventById } from '@/app/tickets/UpcomingShows/events'

// This page only exists for one event — the Block Party's Dance Battle.
// It is intentionally not parameterized like /tickets/UpcomingShows.
const blockParty = getEventById('block-party')!

interface DanceSignupForm {
  firstName: string
  lastName: string
  dancerName: string
  instagram: string
  email: string
  city: string
}

export default function DanceBattleSignupPage() {
  const [formData, setFormData] = useState<DanceSignupForm>({
    firstName: '',
    lastName: '',
    dancerName: '',
    instagram: '',
    email: '',
    city: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      const signupNumber = `DB-${Date.now().toString(36).toUpperCase()}`

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dancerName: formData.dancerName,
        instagram: formData.instagram,
        email: formData.email,
        city: formData.city,
        eventId: 'block-party',
        eventName: 'The Big Bazaar Block Party — Dance Battle',
        signupNumber,
        timestamp: new Date().toISOString(),
      }

      // Persist the entry the same way tickets/RSVPs are saved.
     const res = await fetch('/api/admin/submissions', {  // ← Changed from /api/admin/save
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: {
            ...payload,
            eventId: 'block-party',  // ← This is the key!
            eventSlug: 'block-party',
          }, 
          type: 'dance-signup' 
        }),
      })

      // if (!res.ok) {
      //   throw new Error('Failed to save sign-up')
      // }

      try {
        await fetch('/api/send-dance-signup-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch {
        // Non-blocking
      }

      setIsSuccess(true)
    } catch (error) {
      console.error('❌ Dance battle sign-up failed:', error)
      setErrorMsg('Something went wrong — please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-grove">
      {/* Overlay texture */}
      <div className="absolute inset-0 opacity-20">
        <Image src={overlay} alt="" fill className="object-cover" priority />
      </div>

      {/* Decorative blur elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-henna/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-plaster/10 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
        <Link
          href="/#events"
          scroll={true}
          className="inline-flex items-center gap-2 text-henna hover:text-henna transition-colors font-host-grotesk text-sm group bg-plaster/90 px-4 py-2 rounded-full shadow-sm border border-plaster/10"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </Link>
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 min-h-screen flex items-center justify-center py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-12 h-px bg-plaster/30" />
              <span className="font-host-grotesk text-xs text-plaster/70 uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                <Flame className="w-3 h-3" />
                Block Party Exclusive
                <Flame className="w-3 h-3" />
              </span>
              <span className="w-12 h-px bg-plaster/30" />
            </div>
            <h1 className="font-host-grotesk-narrow font-black text-5xl md:text-6xl lg:text-7xl text-plaster leading-[0.95]">
              Dance Battle
            </h1>
            <p className="font-host-grotesk text-lg text-plaster/70 mt-3">
              Bring your best moves to the street stage. Sign up below to throw down.
            </p>
          </div>

          {/* Event snapshot — solid color blocks, no whitespace filler */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
          >
            <div className="flex flex-col items-center text-center p-4 bg-pomegranate rounded-2xl border border-plaster/10">
              <Calendar className="w-5 h-5 text-plaster mb-2" />
              <span className="font-host-grotesk text-[10px] text-plaster/50 uppercase tracking-wider">
                Date
              </span>
              <span className="font-host-grotesk font-bold text-plaster text-sm mt-1">
                {blockParty.date}
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-pomegranate rounded-2xl border border-plaster/10">
              <Clock className="w-5 h-5 text-plaster mb-2" />
              <span className="font-host-grotesk text-[10px] text-plaster/50 uppercase tracking-wider">
                Time
              </span>
              <span className="font-host-grotesk font-bold text-plaster text-sm mt-1">
                {blockParty.time}
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-pomegranate rounded-2xl border border-plaster/10">
              <MapPin className="w-5 h-5 text-plaster mb-2" />
              <span className="font-host-grotesk text-[10px] text-plaster/50 uppercase tracking-wider">
                Where
              </span>
              <span className="font-host-grotesk font-bold text-plaster text-sm mt-1 text-center">
                {blockParty.location}, {blockParty.city}
              </span>
            </div>
          </motion.div>

          {/* Form panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative overflow-hidden bg-plaster rounded-3xl p-6 md:p-8 border border-plaster/10 shadow-2xl"
          >
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-chartreuse/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-host-grotesk font-bold text-xl text-henna">
                  Sign-Up Sheet
                </h3>
              </div>
              <p className="font-host-grotesk text-henna/50 text-sm mb-4">
                Fill this out to claim your spot in the circle.
              </p>

              {/* Ticket-stub style divider — signature detail for this page */}
              <div className="relative flex items-center my-6">
                <span className="absolute left-[-26px] w-5 h-5 rounded-full bg-poppy" />
                <div className="flex-1 border-t-2 border-dashed border-henna/40" />
                <span className="absolute right-[-26px] w-5 h-5 rounded-full bg-poppy" />
              </div>
              <p className="text-center font-host-grotesk font-black text-[10px] tracking-[0.3em] text-henna/40 uppercase mb-6">
                 Dancer Pass · GNV-DB-26
              </p>

              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="bg-chartreuse/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-chartreuse" />
                  </div>
                  <h2 className="font-host-grotesk font-bold text-2xl text-henna">
                    You&apos;re In! 🔥
                  </h2>
                  <p className="font-host-grotesk text-henna/60 mt-2">
                    {formData.dancerName || formData.firstName}, we&apos;ll see you on the floor.
                  </p>
                  <p className="font-host-grotesk text-xs text-henna/40 mt-4">
                    Keep an eye on your email inbox for confirmation.
                  </p>
                  <Link
                    href="/#events"
                    scroll={true}
                    className="mt-6 inline-block text-chartreuse font-bold text-sm hover:underline transition-colors"
                  >
                    ← Back to Events
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* First / Last name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-henna/80 block mb-1.5">
                        First Name <span className="text-chartreuse">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/50 font-host-grotesk text-henna placeholder:text-henna/30 transition-all duration-200 hover:border-plaster/40"
                        placeholder="Jane"
                      />
                    </div>
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-henna/80 block mb-1.5">
                        Last Name <span className="text-chartreuse">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/50 font-host-grotesk text-henna placeholder:text-henna/30 transition-all duration-200 hover:border-plaster/40"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Dancer name */}
                  <div>
                    <label className="font-host-grotesk font-semibold text-sm text-henna/80 block mb-1.5">
                      Dancer Name <span className="text-chartreuse">*</span>
                    </label>
                    <input
                      type="text"
                      name="dancerName"
                      value={formData.dancerName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/50 font-host-grotesk text-henna placeholder:text-henna/30 transition-all duration-200 hover:border-plaster/40"
                      placeholder="What should we call you on the mic?"
                    />
                  </div>

                  {/* Instagram + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-henna/80 block mb-1.5">
                        Instagram Handle
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/50 font-host-grotesk text-henna placeholder:text-henna/30 transition-all duration-200 hover:border-plaster/40"
                          placeholder="@yourhandle"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-henna/80 block mb-1.5">
                        Email <span className="text-chartreuse">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/50 font-host-grotesk text-henna placeholder:text-henna/30 transition-all duration-200 hover:border-plaster/40"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="font-host-grotesk font-semibold text-sm text-henna/80 block mb-1.5">
                      What City Are You From? <span className="text-chartreuse">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/50 font-host-grotesk text-henna placeholder:text-henna/30 transition-all duration-200 hover:border-plaster/40"
                      placeholder="e.g. Gainesville, FL"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-henna hover:bg-chartreuse text-plaster hover:text-henna font-host-grotesk font-bold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isSubmitting ? 'Locking In Your Spot...' : 'Dance'}
                  </button>

                  {errorMsg && (
                    <p className="text-poppy text-sm font-host-grotesk text-center bg-plaster/10 rounded-lg py-2">
                      {errorMsg}
                    </p>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}