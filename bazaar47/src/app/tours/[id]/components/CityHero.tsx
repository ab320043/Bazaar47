'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Calendar } from 'lucide-react'
import { TourCity } from '@/data/tour-data'

interface CityHeroProps {
  city: TourCity
}

export function CityHero({ city }: CityHeroProps) {
  return (
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
  )
}