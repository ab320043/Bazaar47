// app/components/reopening/reopening-section.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Clock, MapPin, PartyPopper } from 'lucide-react'

export function ReopeningSection() {
  return (
    <section className="relative w-full bg-rosewood overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-chartreuse/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-hippie/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-16 md:py-20 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Eyebrow badge */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-8 h-px bg-chartreuse/60" />
            <span className="font-host-grotesk text-[10px] sm:text-xs text-chartreuse/80 uppercase tracking-[0.3em] font-bold flex items-center gap-2">
              <PartyPopper className="w-3 h-3" />
              Two in one
              <PartyPopper className="w-3 h-3" />
            </span>
            <span className="w-8 h-px bg-chartreuse/60" />
          </div>

          {/* Title */}
          <h2 className="font-host-grotesk-narrow font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-plaster leading-[0.95]">
            Bazaar47 Grand (Re)Opening
          </h2>
          <p className="font-host-grotesk text-lg sm:text-xl md:text-2xl text-chartreuse mt-3 font-semibold">
            ✦ Laila&apos;s Birthday Party ✦
          </p>

          <p className="font-host-grotesk text-sm sm:text-base text-plaster/70 mt-5 max-w-2xl mx-auto">
            Bazaar47 is back. Join us for a night of music, drinks, and community.
            And yes — it&apos;s also Laila&apos;s birthday.
          </p>

          {/* Event details strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-plaster/70 text-sm">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Thursday, Oct 15, 2026
            </span>
            <span className="hidden sm:inline w-px h-4 bg-plaster/20" />
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              8–11 PM
            </span>
            <span className="hidden sm:inline w-px h-4 bg-plaster/20" />
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Bazaar47
            </span>
          </div>

          {/* CTA */}
          <div className="mt-8">
            <Link
              href="/reopening"
              className="inline-flex items-center gap-2 bg-chartreuse hover:bg-plaster text-grove hover:text-rosewood font-host-grotesk font-bold text-base px-8 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg"
            >
              RSVP Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}