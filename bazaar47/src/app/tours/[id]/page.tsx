'use client'

import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Clock, Calendar, Ticket, Heart, Share2 } from 'lucide-react'
import { tourData } from '@/data/tour-data'
import overlay from '@/assets/newAssets/overlay.png'

export default function TourCityPage() {
  const params = useParams()
  const cityId = params.id as string
  
  const city = tourData.find(t => t.id === cityId)

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
      
      {/* ============================================
          HERO IMAGE - Full width, no padding, covers top
          ============================================ */}
      <div className="relative w-full h-[45vh] sm:h-[50vh] md:h-[55vh] min-h-[300px] md:min-h-[350px] overflow-hidden">
        <Image
          src={city.image}
          alt={city.city}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#341B1C] via-[#341B1C]/40 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors font-host-grotesk text-xs sm:text-sm bg-[#341B1C]/50 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#D5C9B1]/10"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Back
          </Link>
        </div>

        {/* City Info - Bottom of image */}
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
          SPLIT SECTION - Mobile: Stacked, Desktop: Side by Side
          ============================================ */}
      <div className="relative w-full">
        
        {/* Mobile: Full width Rosewood background */}
        <div className="lg:hidden absolute inset-0 bg-[#341B1C]">
          <div className="absolute inset-0 opacity-30">
            <Image
              src={overlay}
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
        
        {/* Desktop Left: Rosewood + Overlay */}
        <div className="hidden lg:block absolute inset-0 lg:right-1/2 bg-[#341B1C]">
          <div className="absolute inset-0 opacity-30">
            <Image
              src={overlay}
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
        
        {/* Desktop Right: Plaster */}
        <div className="hidden lg:block absolute inset-0 lg:left-1/2 bg-plaster" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 md:py-12 lg:py-16">
          
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-0 max-w-6xl mx-auto">
            
            {/* ============================================
                LEFT SIDE - About the Venue (50%)
                Mobile: Rosewood background, Desktop: Rosewood+Overlay
                ============================================ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:w-1/2 lg:pr-8 xl:pr-12 bg-[#341B1C] lg:bg-transparent rounded-2xl lg:rounded-none p-6 sm:p-8 lg:p-0"
            >
              <h2 className="font-host-grotesk font-bold text-xl sm:text-2xl md:text-3xl text-[#EFEADE] mb-3 sm:mb-4">
                About the Venue
              </h2>
              <p className="font-host-grotesk text-sm sm:text-base text-[#D5C9B1]/70 leading-relaxed">
                {city.venueDetails || city.description}
              </p>
              
              {city.highlights && city.highlights.length > 0 && (
                <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
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
                RIGHT SIDE - Ticket Info (50%) - Plaster bg
                Mobile: Plaster background, Desktop: Plaster
                ============================================ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:w-1/2 lg:pl-8 xl:pl-12 bg-plaster rounded-2xl lg:rounded-none p-6 sm:p-8 lg:p-0 lg:bg-transparent"
            >
              <div className="space-y-3 sm:space-y-4">
                <h2 className="font-host-grotesk font-bold text-xl sm:text-2xl md:text-3xl text-[#6A2630] mb-3 sm:mb-4">
                  Ticket Information
                </h2>
                
                <div className="space-y-2 sm:space-y-3">
                  <p className="font-host-grotesk text-sm sm:text-base text-[#6A2630]/80 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                    <span className="font-semibold text-[#6A2630] sm:min-w-[70px]">Price:</span>
                    <span>{city.badge}</span>
                  </p>
                  <p className="font-host-grotesk text-sm sm:text-base text-[#6A2630]/80 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                    <span className="font-semibold text-[#6A2630] sm:min-w-[70px]">Location:</span>
                    <span>{city.address}</span>
                  </p>
                  <p className="font-host-grotesk text-sm sm:text-base text-[#6A2630]/80 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                    <span className="font-semibold text-[#6A2630] sm:min-w-[70px]">Time:</span>
                    <span>{city.time}</span>
                  </p>
                  <p className="font-host-grotesk text-sm sm:text-base text-[#6A2630]/80 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                    <span className="font-semibold text-[#6A2630] sm:min-w-[70px]">Date:</span>
                    <span>{city.date}</span>
                  </p>
                </div>

                {/* Ticket Button */}
                <Link href={city.ticketLink || '#'} className="block mt-4 sm:mt-6">
                  <button className="w-full sm:w-auto bg-[#6A2630] hover:bg-[#6A2630]/90 text-plaster font-host-grotesk font-bold text-sm sm:text-base py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2">
                    <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
                    {city.price}
                  </button>
                </Link>
                
                {city.ticketLink && city.ticketLink !== '#' && (
                  <p className="font-host-grotesk text-xs text-[#6A2630]/40 mt-2">
                    Tickets available at thefestfl.com
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* ============================================
              SHARE SECTION
              ============================================ */}
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