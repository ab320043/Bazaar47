'use client'

import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Clock, Calendar, Ticket, Heart, Share2, Send } from 'lucide-react'
import { useState } from 'react'
import { tourData } from '@/data/tour-data'
import overlay from '@/assets/newAssets/overlay.png'

export default function TourCityPage() {
  const params = useParams()
  const cityId = params.id as string
  
  const city = tourData.find(t => t.id === cityId)

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    city: '',
    instagram: '',
    zipCode: '',
    tickets: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Option 1: Using Formspree (free, no backend needed)
    // Replace YOUR_FORM_ID with your Formspree form ID
    try {
      const response = await fetch('https://formspree.io/f/mpqvlgkb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _subject: `RSVP for ${city?.city} - Bazaar À La Carte`,
          _replyto: formData.email,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        setFormData({ fullName: '', email: '', city: '', instagram: '', zipCode: '' , tickets: ''})
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch (error) {
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!city) {
    return (
      <div className="min-h-screen bg-plaster flex items-center justify-center pt-20">
        <div className="text-center px-4">
          <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">City not found</h1>
          <Link href="/" className="text-chartreuse hover:underline mt-4 inline-block font-host-grotesk">
            ← Back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-[#341B1C]">
      
      {/* HERO IMAGE - Full width */}
      <div className="relative w-full h-[45vh] sm:h-[50vh] md:h-[55vh] min-h-[300px] md:min-h-[350px] overflow-hidden">
        <Image
          src={city.image}
          alt={city.city}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#341B1C] via-[#341B1C]/40 to-transparent" />
        
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors font-host-grotesk text-xs sm:text-sm bg-[#341B1C]/50 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#D5C9B1]/10"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Back
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6 md:p-12">
          <div className="container mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-host-grotesk font-bold text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-[#EFEADE] leading-tight"
            >
              {city.city}
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-[#D5C9B1]/70 font-host-grotesk text-xs sm:text-sm md:text-base"
            >
              <span className="flex items-center gap-1 sm:gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                {city.date}
              </span>
              <span className="hidden sm:inline text-[#D5C9B1]/30">•</span>
              <span className="flex items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                {city.time}
              </span>
              <span className="hidden sm:inline text-[#D5C9B1]/30">•</span>
              <span className="flex items-center gap-1 sm:gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                {city.venue}
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ============================================
    SPLIT SECTION - Same style as About section
    Left: Rosewood+Overlay (About the Venue)
    Right: Plaster (RSVP Form)
    ============================================ */}
      <div className="relative w-full">
        
        {/* Left side background - Rosewood + Overlay */}
        <div className="lg:hidden absolute inset-0 bg-[#341B1C]">
          <div className="absolute inset-0 opacity-30">
            <Image src={overlay} alt="" fill className="object-cover" priority />
          </div>
        </div>
        
        <div className="hidden lg:block absolute inset-0 lg:right-1/2 bg-[#341B1C]">
          <div className="absolute inset-0 opacity-30">
            <Image src={overlay} alt="" fill className="object-cover" priority />
          </div>
        </div>
        
        {/* Right side background - Plaster */}
        <div className="hidden lg:block absolute inset-0 lg:left-1/2 bg-plaster" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 md:py-12 lg:py-16">
          
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-0 max-w-6xl mx-auto">
            
            {/* ============================================
                LEFT SIDE - About the Venue (50%)
                Rosewood+Overlay bg, white text, left aligned
                ============================================ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:w-1/2 lg:pr-8 xl:pr-12 bg-[#341B1C] lg:bg-transparent rounded-2xl lg:rounded-none p-6 sm:p-8 lg:py-8 xl:py-10 lg:pl-0 lg:pr-8"
            >
              {/* Tour Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex items-center gap-3 mb-4 sm:mb-5"
              >
                <span className="w-6 sm:w-8 h-px bg-chartreuse/60" />
                <span className="font-host-grotesk text-[10px] sm:text-xs text-chartreuse/60 uppercase tracking-[0.3em] font-bold">
                  Bazaar À La Carte
                </span>
                <span className="w-6 sm:w-8 h-px bg-chartreuse/60" />
              </motion.div>

              <h2 className="font-host-grotesk font-bold text-2xl sm:text-3xl md:text-4xl text-[#EFEADE] mb-3 sm:mb-4 text-left">
                About the Venue
              </h2>
              
              <p className="font-host-grotesk text-base sm:text-lg md:text-xl text-[#D5C9B1]/80 leading-relaxed text-left">
                {city.venueDetails || city.description}
              </p>
              
              {city.highlights && city.highlights.length > 0 && (
                <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3 justify-start">
                  {city.highlights.map((highlight, index) => (
                    <span 
                      key={index} 
                      className="bg-[#CCD145]/10 text-[#CCD145] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-host-grotesk font-semibold"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ============================================
                RIGHT SIDE - RSVP Form (50%) - Plaster bg
                ============================================ */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="lg:w-1/2 lg:pl-8 xl:pl-12 bg-plaster rounded-2xl lg:rounded-none p-6 sm:p-8 lg:py-8 xl:py-10 lg:bg-transparent"
            >
              <div className="space-y-3 sm:space-y-4">
                <h2 className="font-host-grotesk font-bold text-2xl sm:text-3xl md:text-4xl text-[#6A2630] mb-3 sm:mb-4">
                  RSVP for {city.city}
                </h2>
                
                {isSuccess ? (
                  <div className="bg-chartreuse/10 border border-chartreuse/30 rounded-xl p-6 text-center">
                    <p className="font-host-grotesk text-lg font-semibold text-[#6A2630]">🎉 You&apos;re RSVP&apos;d!</p>
                    <p className="font-host-grotesk text-sm text-[#6A2630]/60 mt-2">We&apos;ll see you at {city.city}! Check your email for details.</p>
                    <button 
                      onClick={() => setIsSuccess(false)}
                      className="mt-4 text-chartreuse font-bold text-sm hover:underline"
                    >
                      Submit another RSVP
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                        Full Name <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                        placeholder="Your full name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                        Email <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                        placeholder="you@example.com"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                        Which city are you from? <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                        placeholder="e.g. Gainesville, FL"
                      />
                    </div>

                    {/* Number of Tickets */}
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                        Number of Tickets <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="number"
                        name="tickets"
                        min="1"
                        max="10"
                        value={formData.tickets || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                        placeholder="How many tickets?"
                      />
                    </div>

                    {/* Instagram */}
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                        Instagram Handle
                      </label>
                      <div className="flex items-center">
                        <span className="font-host-grotesk text-[#6A2630]/40 bg-plaster/50 px-3 py-2.5 rounded-l-xl border border-r-0 border-[#6A2630]/20">@</span>
                        <input
                          type="text"
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleChange}
                          className="flex-1 px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                          placeholder="yourhandle"
                        />
                      </div>
                    </div>

                    {/* Zip Code */}
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                        Zip Code <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                        placeholder="e.g. 32601"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#6A2630] hover:bg-[#6A2630]/90 text-plaster font-host-grotesk font-bold text-sm sm:text-base py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'RSVP Now'}
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>

          {/* Share Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-6xl mx-auto mt-8 sm:mt-10 md:mt-12 flex flex-wrap items-center justify-between gap-4 pt-6 sm:pt-8 border-t border-[#D5C9B1]/10"
          >
            <p className="font-host-grotesk text-xs sm:text-sm text-[#D5C9B1]/30">
              ✦ Part of the Bazaar À La Carte Florida Tour 2026
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <button className="text-[#D5C9B1]/30 hover:text-[#D5C9B1]/60 transition-colors">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button className="text-[#D5C9B1]/30 hover:text-[#D5C9B1]/60 transition-colors">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

    </section>
  )
}