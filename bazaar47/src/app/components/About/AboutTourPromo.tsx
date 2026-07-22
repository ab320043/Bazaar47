'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Piece from '@/assets/newAssets/Piece.jpg'
// import highwaySign from '@/assets/newAssets/highwaySign.png'
import { AboutTourPromoRight } from './AboutTourPromoRight'

export function AboutTourPromo() {
  return (
    <div className="relative w-full">
      {/* Desktop: Split backgrounds */}
      <div className="hidden md:block absolute inset-0 md:right-1/2 bg-plaster" />
      <div className="hidden md:block absolute inset-0 md:left-1/2 bg-grove" />

      {/* Full width container - NO PADDING on the wrapper */}
      <div className="relative z-10 w-full py-0">
        
        <div className="flex flex-col md:flex-row gap-0 items-stretch min-h-[400px] md:min-h-[550px]">
          
          {/* LEFT: Flyer (50%) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="w-full md:w-1/2 bg-plaster relative overflow-hidden"
          >
            <div className="relative w-full h-full min-h-[350px] md:min-h-[400px]">
              <Image
                src={Piece}
                alt="Bazaar À La Carte Florida Tour"
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </motion.div>


          {/* RIGHT: Description + Buttons */}
          <AboutTourPromoRight />
          
        </div>
      </div>
    </div>
  )
}