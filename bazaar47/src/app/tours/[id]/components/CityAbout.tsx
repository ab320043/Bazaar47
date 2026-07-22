'use client'

import { motion } from 'framer-motion'
import { TourCity } from '@/data/tour-data'

interface CityAboutProps {
  city: TourCity
}

export function CityAbout({ city }: CityAboutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="lg:w-1/2 bg-[#341B1C] lg:bg-transparent rounded-2xl lg:rounded-none p-6 sm:p-8 lg:p-0 lg:pr-8 xl:pr-12"
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <span className="w-6 sm:w-8 h-px bg-chartreuse/60" />
        <span className="font-host-grotesk text-[10px] sm:text-xs text-chartreuse/60 uppercase tracking-[0.3em] font-bold">
          Bazaar À La Carte
        </span>
        <span className="w-6 sm:w-8 h-px bg-chartreuse/60" />
      </div>

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
  )
}