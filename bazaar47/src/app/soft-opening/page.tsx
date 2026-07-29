'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Send, CheckCircle, Users, Calendar, MapPin, Clock, Gift, Sparkles } from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'

export default function SoftOpeningPage() {
  type RSVPData = {
    fullName: string
    email: string
    phone: string
    instagram: string
    city: string
    coming: 'yes' | 'no'
    guests: string
  }

  const [formData, setFormData] = useState<RSVPData>({
    fullName: '',
    email: '',
    phone: '',
    instagram: '',
    city: '',
    coming: 'yes',
    guests: '1',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const saveToAdmin = async (data: RSVPData) => {
    try {
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...data,
            eventType: 'soft-opening',
            timestamp: new Date().toISOString(),
          },
          type: 'rsvp',
        }),
      })
      if (!response.ok) {
        console.error('Failed to save to admin')
      }
    } catch (error) {
      console.error('Failed to save to admin:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('https://formspree.io/f/mpqvlgkb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _subject: `Soft Opening RSVP - ${formData.fullName}`,
          _replyto: formData.email,
        }),
      })

      if (response.ok) {
        await saveToAdmin(formData)
        setIsSuccess(true)
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          instagram: '',
          city: '',
          coming: 'yes',
          guests: '1',
        })
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch (error) {
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-rosewood">
      
      {/* Background with overlay */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src={overlay}
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Back to Home */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-plaster/60 hover:text-plaster transition-colors font-host-grotesk text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 min-h-screen flex items-center justify-center py-20">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-12 h-px bg-chartreuse/40" />
              <span className="font-host-grotesk text-xs text-chartreuse/60 uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Friends + Family
                <Sparkles className="w-3 h-3" />
              </span>
              <span className="w-12 h-px bg-chartreuse/40" />
            </div>
            <h1 className="font-host-grotesk-narrow font-bold text-4xl md:text-5xl lg:text-6xl text-plaster leading-tight">
              Soft Opening
            </h1>
            <p className="font-host-grotesk text-lg text-plaster/50 mt-3">
              Be among the first to experience Bazaar47
            </p>
          </div>

          {/* Event Details - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative bg-gradient-to-br from-plaster/10 to-plaster/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-plaster/10 mb-8 overflow-hidden"
          >
            {/* Decorative glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-chartreuse/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-hippie/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Gift className="w-5 h-5 text-chartreuse" />
                <h3 className="font-host-grotesk font-bold text-plaster text-lg">Event Details</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-4 bg-plaster/5 rounded-xl border border-plaster/5 hover:bg-plaster/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-chartreuse/10 flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5 text-chartreuse" />
                  </div>
                  <span className="font-host-grotesk text-xs text-plaster/50 uppercase tracking-wider">Date</span>
                  <span className="font-host-grotesk font-bold text-plaster text-base mt-1">Friday, Aug 14</span>
                </div>
                
                <div className="flex flex-col items-center p-4 bg-plaster/5 rounded-xl border border-plaster/5 hover:bg-plaster/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-chartreuse/10 flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5 text-chartreuse" />
                  </div>
                  <span className="font-host-grotesk text-xs text-plaster/50 uppercase tracking-wider">Time</span>
                  <span className="font-host-grotesk font-bold text-plaster text-base mt-1">7:00 — 9:00 PM</span>
                </div>
                
                <div className="flex flex-col items-center p-4 bg-plaster/5 rounded-xl border border-plaster/5 hover:bg-plaster/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-chartreuse/10 flex items-center justify-center mb-3">
                    <MapPin className="w-5 h-5 text-chartreuse" />
                  </div>
                  <span className="font-host-grotesk text-xs text-plaster/50 uppercase tracking-wider">Location</span>
                  <span className="font-host-grotesk font-bold text-plaster text-base mt-1">60 SW 2nd St</span>
                  <span className="font-host-grotesk text-xs text-plaster/30 mt-0.5">Gainesville, FL</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RSVP Form - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative bg-gradient-to-br from-plaster/10 to-plaster/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-plaster/10 overflow-hidden"
          >
            {/* Decorative glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-chartreuse/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-chartreuse" />
                <h3 className="font-host-grotesk font-bold text-plaster text-lg">RSVP</h3>
                <span className="ml-auto font-host-grotesk text-xs text-plaster/30">Limited spots available</span>
              </div>

              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="bg-chartreuse/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-chartreuse" />
                  </div>
                  <h2 className="font-host-grotesk font-bold text-2xl text-plaster">You&apos;re RSVP&apos;d! 🎉</h2>
                  <p className="font-host-grotesk text-plaster/60 mt-2">We can&apos;t wait to see you at the Soft Opening!</p>
                  <p className="font-host-grotesk text-xs text-plaster/30 mt-4">Check your email for details.</p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="mt-6 text-chartreuse font-bold text-sm hover:underline transition-colors"
                  >
                    Submit another RSVP
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="font-host-grotesk font-semibold text-sm text-plaster/80 block mb-1.5">
                      Full Name <span className="text-poppy">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-plaster placeholder:text-plaster/30 transition-all duration-200 hover:border-plaster/40"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Email & Phone - Two columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-plaster/80 block mb-1.5">
                        Email <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-plaster placeholder:text-plaster/30 transition-all duration-200 hover:border-plaster/40"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-plaster/80 block mb-1.5">
                        Phone Number <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-plaster placeholder:text-plaster/30 transition-all duration-200 hover:border-plaster/40"
                        placeholder="(352) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Instagram & City - Two columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-plaster/80 block mb-1.5">
                        Instagram Handle
                      </label>
                      <div className="flex items-center">
                        <span className="font-host-grotesk text-plaster/40 bg-plaster/10 px-3 py-3 rounded-l-xl border border-r-0 border-plaster/20">@</span>
                        <input
                          type="text"
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleChange}
                          className="flex-1 px-4 py-3 bg-plaster/10 border border-plaster/20 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-plaster placeholder:text-plaster/30 transition-all duration-200 hover:border-plaster/40"
                          placeholder="yourhandle"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-plaster/80 block mb-1.5">
                        What city do you live in? <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-plaster placeholder:text-plaster/30 transition-all duration-200 hover:border-plaster/40"
                        placeholder="e.g. Gainesville, FL"
                      />
                    </div>
                  </div>

                  {/* Coming & Guests - Two columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-plaster/80 block mb-1.5">
                        Are you coming? <span className="text-poppy">*</span>
                      </label>
                      <div className="flex gap-4 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="coming"
                            value="yes"
                            checked={formData.coming === 'yes'}
                            onChange={handleChange}
                            className="w-4 h-4 text-chartreuse accent-chartreuse"
                          />
                          <span className={`font-host-grotesk ${formData.coming === 'yes' ? 'text-plaster' : 'text-plaster/50'} transition-colors`}>
                            Yes
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="coming"
                            value="no"
                            checked={formData.coming === 'no'}
                            onChange={handleChange}
                            className="w-4 h-4 text-chartreuse accent-chartreuse"
                          />
                          <span className={`font-host-grotesk ${formData.coming === 'no' ? 'text-plaster' : 'text-plaster/50'} transition-colors`}>
                            No
                          </span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-plaster/80 block mb-1.5">
                        How many guests? <span className="text-poppy">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(formData.guests) || 0
                            if (val > 0) setFormData({ ...formData, guests: String(val - 1) })
                          }}
                          className="w-10 h-10 rounded-xl bg-plaster/10 hover:bg-plaster/20 text-plaster transition-colors flex items-center justify-center"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          name="guests"
                          min="0"
                          max="10"
                          value={formData.guests}
                          onChange={handleChange}
                          required
                          className="w-16 text-center px-2 py-3 bg-plaster/10 border border-plaster/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-plaster"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(formData.guests) || 0
                            if (val < 10) setFormData({ ...formData, guests: String(val + 1) })
                          }}
                          className="w-10 h-10 rounded-xl bg-plaster/10 hover:bg-plaster/20 text-plaster transition-colors flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#FFB0BC] hover:bg-[#CCD145] text-rosewood hover:text-grove font-host-grotesk font-bold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <span className="relative z-10">{isSubmitting ? 'Submitting...' : 'RSVP Now'}</span>
                    <Send className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center font-host-grotesk text-xs text-plaster/20 mt-8"
          >
            ✦ Bazaar47 • Friends + Family Soft Opening ✦
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}