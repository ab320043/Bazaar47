'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Send, CheckCircle, Users, Calendar, MapPin, Clock, Gift, Sparkles, Heart, Book, Palette, Coins, Leaf } from 'lucide-react'
import softOpen from '@/assets/newAssets/softOpen.png'

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
    <section className="relative w-full min-h-screen overflow-hidden bg-[#C4C687]">
      
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="olive-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="#341B1C" />
              <circle cx="30" cy="30" r="2" fill="#CCD145" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#olive-pattern)" />
        </svg>
      </div>

      {/* Back to Home */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-rosewood/70 hover:text-rosewood transition-colors font-host-grotesk text-sm group bg-plaster/30 backdrop-blur-sm px-4 py-2 rounded-full border border-rosewood/10"
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
          className="max-w-6xl w-full"
        >

          {/* ============================================
              GRAND OPENING - MARQUEE ANIMATION (FIXED)
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="relative overflow-hidden bg-rosewood/10 border border-rosewood/20 rounded-2xl p-3 md:p-4 mb-8"
          >
            <div className="flex whitespace-nowrap animate-marquee">
              {/* Duplicate content for seamless loop */}
              <div className="flex items-center gap-3 mx-4 font-host-grotesk text-rosewood text-sm md:text-base font-semibold shrink-0">
                <Sparkles className="w-4 h-4 text-rosewood shrink-0" />
                Mark your calendars!
                <span className="font-bold text-rosewood">Grand Opening Block Party — Saturday, August 22</span>
                <Sparkles className="w-4 h-4 text-rosewood shrink-0" />
              </div>
              <div className="flex items-center gap-3 mx-4 font-host-grotesk text-rosewood text-sm md:text-base font-semibold shrink-0">
                <Sparkles className="w-4 h-4 text-rosewood shrink-0" />
                Mark your calendars!
                <span className="font-bold text-rosewood">Grand Opening Block Party — Saturday, August 22</span>
                <Sparkles className="w-4 h-4 text-rosewood shrink-0" />
              </div>
              <div className="flex items-center gap-3 mx-4 font-host-grotesk text-rosewood text-sm md:text-base font-semibold shrink-0">
                <Sparkles className="w-4 h-4 text-rosewood shrink-0" />
                Mark your calendars!
                <span className="font-bold text-rosewood">Grand Opening Block Party — Saturday, August 22</span>
                <Sparkles className="w-4 h-4 text-rosewood shrink-0" />
              </div>
              <div className="flex items-center gap-3 mx-4 font-host-grotesk text-rosewood text-sm md:text-base font-semibold shrink-0">
                <Sparkles className="w-4 h-4 text-rosewood shrink-0" />
                Mark your calendars!
                <span className="font-bold text-rosewood">Grand Opening Block Party — Saturday, August 22</span>
                <Sparkles className="w-4 h-4 text-rosewood shrink-0" />
              </div>
            </div>
          </motion.div>

          {/* ============================================
              LEFT: IMAGE | RIGHT: WISHLIST + INFO
              ============================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* LEFT - Full height image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="relative rounded-2xl overflow-hidden shadow-xl border border-rosewood/10 h-[400px] md:h-[500px] lg:h-full min-h-[400px]"
            >
              <Image
                src={softOpen}
                alt="Soft Opening Flyer"
                className="w-full h-full object-cover"
                priority
                quality={100}
              />
              {/* Decorative corner tag */}
              {/* <div className="absolute top-3 right-3 bg-rosewood/80 backdrop-blur-sm text-plaster text-[10px] font-host-grotesk font-bold px-3 py-1 rounded-full">
                ✦ Friends + Family ✦
              </div> */}
            </motion.div>

            {/* RIGHT - Event Info + Wishlist */}
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="text-left">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-px bg-rosewood/30" />
                  <span className="font-host-grotesk text-xs text-rosewood/60 uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                    <Heart className="w-3 h-3" />
                    Friends + Family
                    <Heart className="w-3 h-3" />
                  </span>
                  <span className="w-8 h-px bg-rosewood/30" />
                </div>
                <h1 className="font-host-grotesk-narrow font-bold text-4xl md:text-5xl text-rosewood leading-tight">
                  Soft Opening
                </h1>
                <p className="font-host-grotesk text-base text-rosewood/50 mt-1">
                  Be among the first to experience Bazaar47
                </p>
              </div>

              {/* Event Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative bg-plaster/20 backdrop-blur-sm rounded-2xl p-5 border border-plaster/20 overflow-hidden"
              >
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-chartreuse/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-hippie/10 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-4 h-4 text-rosewood" />
                    <h3 className="font-host-grotesk font-bold text-rosewood text-sm">Event Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col items-center p-3 bg-plaster/20 rounded-xl border border-plaster/10 hover:bg-plaster/30 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-chartreuse/20 flex items-center justify-center mb-2">
                        <Calendar className="w-4 h-4 text-rosewood" />
                      </div>
                      <span className="font-host-grotesk text-[10px] text-rosewood/50 uppercase tracking-wider">Date</span>
                      <span className="font-host-grotesk font-bold text-rosewood text-sm mt-0.5">Fri, Aug 14</span>
                    </div>
                    
                    <div className="flex flex-col items-center p-3 bg-plaster/20 rounded-xl border border-plaster/10 hover:bg-plaster/30 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-chartreuse/20 flex items-center justify-center mb-2">
                        <Clock className="w-4 h-4 text-rosewood" />
                      </div>
                      <span className="font-host-grotesk text-[10px] text-rosewood/50 uppercase tracking-wider">Time</span>
                      <span className="font-host-grotesk font-bold text-rosewood text-sm mt-0.5">7:00 — 9:00 PM</span>
                    </div>
                    
                    <div className="flex flex-col items-center p-3 bg-plaster/20 rounded-xl border border-plaster/10 hover:bg-plaster/30 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-chartreuse/20 flex items-center justify-center mb-2">
                        <MapPin className="w-4 h-4 text-rosewood" />
                      </div>
                      <span className="font-host-grotesk text-[10px] text-rosewood/50 uppercase tracking-wider">Location</span>
                      <span className="font-host-grotesk font-bold text-rosewood text-sm mt-0.5">60 SW 2nd St</span>
                      <span className="font-host-grotesk text-[10px] text-rosewood/30">Gainesville, FL</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Wishlist Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="bg-rosewood/5 border border-rosewood/10 rounded-2xl p-5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-rosewood fill-rosewood/10" />
                  <h3 className="font-host-grotesk font-bold text-rosewood text-sm">Wishlist</h3>
                  <span className="font-host-grotesk text-[12px] text-rosewood/30 ml-auto">(Optional)</span>
                </div>
                <p className="font-host-grotesk text-sm text-rosewood/60 mb-3 leading-relaxed">
                  If you would like to bring a gift, here are some ideas:
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col items-center p-3 bg-plaster/20 rounded-xl border border-rosewood/5 hover:bg-plaster/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-chartreuse/10 flex items-center justify-center mb-1">
                      <Leaf className="w-4 h-4 text-rosewood" />
                    </div>
                    <span className="font-host-grotesk font-medium text-rosewood text-xs">Plants</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-plaster/20 rounded-xl border border-rosewood/5 hover:bg-plaster/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-chartreuse/10 flex items-center justify-center mb-1">
                      <Book className="w-4 h-4 text-rosewood" />
                    </div>
                    <span className="font-host-grotesk font-medium text-rosewood text-xs">Books</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-plaster/20 rounded-xl border border-rosewood/5 hover:bg-plaster/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-chartreuse/10 flex items-center justify-center mb-1">
                      <Palette className="w-4 h-4 text-rosewood" />
                    </div>
                    <span className="font-host-grotesk font-medium text-rosewood text-xs">Art</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-plaster/20 rounded-xl border border-rosewood/5 hover:bg-plaster/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-chartreuse/10 flex items-center justify-center mb-1">
                      <Coins className="w-4 h-4 text-rosewood" />
                    </div>
                    <span className="font-host-grotesk font-medium text-rosewood text-xs">Money</span>
                  </div>
                </div>
                <p className="font-host-grotesk text-[16px] text-rosewood/40 mt-3 text-center italic">
                  ✦ Tchotchkes / trinkets for the bookshelf also welcome ✦
                </p>
              </motion.div>
            </div>
          </div>

          {/* ============================================
              FORM - Full width below
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative bg-plaster/20 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-plaster/20 overflow-hidden"
          >
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-chartreuse/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-rosewood" />
                <h3 className="font-host-grotesk font-bold text-rosewood text-lg">RSVP</h3>
                <span className="ml-auto font-host-grotesk text-xs text-rosewood/30">Limited spots available</span>
              </div>

              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="bg-chartreuse/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-rosewood" />
                  </div>
                  <h2 className="font-host-grotesk font-bold text-2xl text-rosewood">Youre RSVPd! 🎉</h2>
                  <p className="font-host-grotesk text-rosewood/60 mt-2">We cant wait to see you at the Soft Opening!</p>
                  <p className="font-host-grotesk text-xs text-rosewood/30 mt-4">Check your email for details.</p>
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
                    <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                      Full Name <span className="text-poppy">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-plaster/30 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood placeholder:text-rosewood/30 transition-all duration-200 hover:border-rosewood/30"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Email <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/30 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood placeholder:text-rosewood/30 transition-all duration-200 hover:border-rosewood/30"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Phone <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/30 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood placeholder:text-rosewood/30 transition-all duration-200 hover:border-rosewood/30"
                        placeholder="(352) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Instagram & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Instagram
                      </label>
                      <div className="flex items-center">
                        <span className="font-host-grotesk text-rosewood/40 bg-plaster/30 px-3 py-3 rounded-l-xl border border-r-0 border-rosewood/15">@</span>
                        <input
                          type="text"
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleChange}
                          className="flex-1 px-4 py-3 bg-plaster/30 border border-rosewood/15 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood placeholder:text-rosewood/30 transition-all duration-200 hover:border-rosewood/30"
                          placeholder="handle"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        City <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/30 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood placeholder:text-rosewood/30 transition-all duration-200 hover:border-rosewood/30"
                        placeholder="e.g. Gainesville, FL"
                      />
                    </div>
                  </div>

                  {/* Coming & Guests */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Coming? <span className="text-poppy">*</span>
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
                          <span className={`font-host-grotesk ${formData.coming === 'yes' ? 'text-rosewood' : 'text-rosewood/50'} transition-colors`}>
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
                          <span className={`font-host-grotesk ${formData.coming === 'no' ? 'text-rosewood' : 'text-rosewood/50'} transition-colors`}>
                            No
                          </span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Guests <span className="text-poppy">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(formData.guests) || 0
                            if (val > 0) setFormData({ ...formData, guests: String(val - 1) })
                          }}
                          className="w-10 h-10 rounded-xl bg-plaster/30 hover:bg-plaster/50 text-rosewood transition-colors flex items-center justify-center border border-rosewood/10"
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
                          className="w-16 text-center px-2 py-3 bg-plaster/30 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(formData.guests) || 0
                            if (val < 10) setFormData({ ...formData, guests: String(val + 1) })
                          }}
                          className="w-10 h-10 rounded-xl bg-plaster/30 hover:bg-plaster/50 text-rosewood transition-colors flex items-center justify-center border border-rosewood/10"
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
                    className="w-full bg-rosewood hover:bg-chartreuse text-plaster hover:text-grove font-host-grotesk font-bold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
            className="text-center font-host-grotesk text-xs text-rosewood/20 mt-8"
          >
            ✦ Bazaar47 • Friends + Family Soft Opening ✦
          </motion.p>
        </motion.div>
      </div>

      {/* Marquee keyframes - add this to your global CSS or use inline style */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
          width: fit-content;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}