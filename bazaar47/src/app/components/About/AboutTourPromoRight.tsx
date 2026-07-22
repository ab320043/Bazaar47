'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function AboutTourPromoRight() {
  const scrollToTour = () => {
    const tourSection = document.getElementById('tour-section')
    if (tourSection) tourSection.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      viewport={{ once: true }}
      className="w-full md:w-1/2 bg-grove py-8 sm:py-10 md:py-12 px-6 sm:px-8 md:px-10 lg:px-12 flex flex-col justify-center text-center md:text-left"
    >
      {/* Tour Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        viewport={{ once: true }}
        className="flex items-center justify-center md:justify-start gap-3 mb-3 sm:mb-4"
      >
        <span className="w-6 sm:w-8 h-px bg-chartreuse/60" />
        <span className="font-host-grotesk text-[10px] sm:text-xs text-chartreuse/60 uppercase tracking-[0.3em] font-bold">
          Bazaar Florida Tour 
        </span>
        <span className="w-6 sm:w-8 h-px bg-chartreuse/60" />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
        className="font-host-grotesk font-bold text-[24px] sm:text-[28px] md:text-[38px] lg:text-[44px] leading-[108%] tracking-normal text-[#EFEADE] mb-2 sm:mb-3"
      >
        Florida Tour 2026
      </motion.h3>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        viewport={{ once: true }}
        className="space-y-2 sm:space-y-3 max-w-xl mx-auto md:mx-0"
      >
        <p className="font-host-grotesk font-regular text-[14px] sm:text-[15px] md:text-[17px] leading-[120%] tracking-normal text-[#D5C9B1]">
          <span className="font-bold text-chartreuse">A touring night market around the Sunshine State</span>
        </p>
        <p className="font-host-grotesk font-regular text-[14px] sm:text-[15px] md:text-[17px] leading-[120%] tracking-normal text-[#D5C9B1]">
          Following last year’s successful run around the Sunshine State, Gainesville’s beloved night market series, the Bazaar Florida Tour, is back on the road this summer, sharing its signature blend of artisan makers selling handmade goods, artistic and cultural performances, and interactive workshops and activities. The statewide event series highlighting local vendors and creatives in Orlando, Miami, Jacksonville and Tampa.
        </p>
        <p className="font-host-grotesk font-regular text-[14px] sm:text-[15px] md:text-[17px] leading-[120%] tracking-normal text-[#D5C9B1]">
            “This platform is so experimental that it allows creatives to try something for the first time, experiment with it and showcase it to a very supportive, open community of people who are naturally drawn to these events.”
        </p>
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        viewport={{ once: true }}
        className="flex flex-wrap justify-center md:justify-start gap-8 sm:gap-8 mt-5 sm:mt-6 md:mt-8"
      >
        <button
          onClick={scrollToTour}
          className="bg-sand-dune hover:bg-sand-dune/80 text-grove font-host-grotesk font-bold text-xs sm:text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5"
          style={{ borderRadius: '11px' }}
        >
          See Tour Dates
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>

        <Link href="/vendors">
          <button
            className="bg-sand-dune hover:bg-sand-dune/80 text-grove font-host-grotesk font-bold text-xs sm:text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5"
            style={{ borderRadius: '11px' }}
          >
            Vendor Application
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </Link>
      </motion.div>
    </motion.div>
  )
}