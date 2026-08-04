'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Music, ArrowRight } from 'lucide-react'
import { eventFlyer } from './events-data'
import { showDetails } from './show-config'

export function EventsFlyerTickets() {
  return (
    <div className="relative w-full">
      {/* Desktop: Split backgrounds — extends edge-to-edge behind the flex row below */}
      <div className="hidden md:block absolute inset-0 md:right-1/2 bg-henna" />
      <div className="hidden md:block absolute inset-0 md:left-1/2 bg-gradient-to-br from-henna via-henna to-poppy/70" />

      {/* Full width container — no padding on the wrapper */}
      <div className="relative z-10 w-full py-0">
        <div className="flex flex-col md:flex-row gap-0 items-stretch min-h-[280px] md:min-h-[320px]">
          {/* LEFT: Flyer (50%) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="w-full md:w-1/2 bg-henna relative overflow-hidden"
          >
            <div className="relative w-full h-full min-h-[240px] md:min-h-[280px]">
              <Image
                src={eventFlyer}
                alt="Event Flyer"
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </motion.div>

          {/* RIGHT: Tickets CTA (50%) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="w-full md:w-1/2 bg-gradient-to-br from-henna via-henna to-poppy/70 relative overflow-hidden flex flex-col justify-center p-8 md:p-10 lg:p-12"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-plaster/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-poppy/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-poppy" />
                <span className="font-host-grotesk font-bold text-poppy text-xs uppercase tracking-wider">
                  Limited Availability
                </span>
              </div>

              <h4 className="font-host-grotesk font-black text-2xl md:text-3xl text-plaster mb-2">
                Get Your Tickets
              </h4>

              <p className="font-host-grotesk text-plaster/60 text-sm mb-6">
                Capacity is limited — secure your spot now.
              </p>

              <Link
                href={showDetails.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 font-host-grotesk font-bold text-henna bg-plaster hover:bg-plaster/90 px-7 py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.03] text-sm w-full md:w-auto"
              >
                <span>Get Tickets Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="font-host-grotesk text-plaster/30 text-xs mt-3">
                {showDetails.ticketDisplay}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}