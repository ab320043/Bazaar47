'use client'

import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Sparkles, Music, ArrowRight, ChevronDown } from 'lucide-react'
import { useRef, useState } from 'react'
import { artists, eventFlyer } from '@/app/components/calendar-events/events-data'
import { showDetails } from '@/app/components/calendar-events/show-config'
import type { Artist } from '@/app/components/calendar-events/types'

import overlay from '@/assets/newAssets/overlay.png'

function scrollToCalendar(e: React.MouseEvent) {
  e.preventDefault()
  document.getElementById('calendar')?.scrollIntoView({ behavior: 'smooth' })
}

function ArtistPanel({ artist, index }: { artist: Artist; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [active, setActive] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 70 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 70 }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: 'easeOut' }}
      onClick={() => setActive((a) => !a)}
      data-active={active}
      className={`group relative flex-1 md:hover:flex-[2.3] md:data-[active=true]:flex-[2.3] transition-[flex-grow] duration-700 ease-out overflow-hidden cursor-pointer min-h-[420px] md:min-h-0 first:rounded-t-3xl md:first:rounded-t-none md:first:rounded-l-3xl last:rounded-b-3xl md:last:rounded-b-none md:last:rounded-r-3xl ${artist.cardBg}`}
    >
      {/* Image */}
      <Image
        src={artist.image}
        alt={artist.name}
        fill
        priority={index === 0}
        className="object-cover opacity-90 transition-transform duration-700 ease-out md:group-hover:scale-110 group-data-[active=true]:scale-110"
      />

      {/* Solid-color overlay (no white/plaster gaps) */}
      {/* <div
        className={`absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t ${artist.overlayGradient} pointer-events-none`}
      /> */}

      {/* Time badge — always visible */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-plaster px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-md">
        <p className="font-host-grotesk font-bold text-henna text-xs md:text-sm leading-none">
          {artist.time}
        </p>
        {/* {artist.duration && (
          <p className="font-host-grotesk text-henna/50 text-[10px] md:text-xs leading-none mt-1">
            {artist.duration}
          </p>
        )} */}
      </div>

      {/* Name + bio (bio reveals on hover / tap) */}
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 lg:p-8">
        <h3 className="font-host-grotesk font-black text-2xl md:text-3xl lg:text-4xl text-plaster tracking-tight">
          {artist.name}
        </h3>
        <div className="w-10 h-1 bg-plaster/50 rounded-full mt-2 mb-1 md:group-hover:w-16 group-data-[active=true]:w-16 transition-all duration-500" />

        <div className="max-h-0 opacity-0 md:group-hover:max-h-48 md:group-hover:opacity-100 group-data-[active=true]:max-h-48 group-data-[active=true]:opacity-100 overflow-hidden transition-all duration-500 ease-out">
          <p className="font-host-grotesk text-plaster/85 text-sm md:text-base leading-relaxed pt-2 pb-3">
            {artist.bio}
          </p>
          <Link
            href={`https://${artist.website}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 font-host-grotesk font-semibold text-plaster transition-colors text-sm"
          >
            {artist.website}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export function EventsSection() {
  return (
    <section className="relative w-full overflow-hidden bg-sand-dune py-16 md:py-20 lg:py-24">
         {/* ============================================
          OVERLAY LAYER
          ============================================ */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src={overlay}
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >

          <h2 className="font-host-grotesk font-bold text-[32px] sm:text-[40px] md:text-[48px] lg:text-[58px] leading-[108%] tracking-normal text-[#341B1C] text-center md:text-left">
            <span className="text-rosewood">RUN OF SHOW</span>{' '}
          </h2>

          <div className="flex items-left gap-3 mt-5 flex-wrap">
            <span className="font-host-grotesk font-semibold text-groove text-base md:text-lg">
              {showDetails.dateDisplay}
            </span>
            <span>|</span>
            <span className="font-host-grotesk font-semibold text-groove text-base md:text-lg">
              {showDetails.venue}
            </span>
          </div>
        </motion.div>

        {/* Interactive artist collage — horizontal on desktop, stacked on mobile */}
        <div className="flex flex-col md:flex-row md:h-[640px] lg:h-[720px] rounded-3xl overflow-hidden shadow-2xl">
          {artists.map((artist, index) => (
            <ArtistPanel key={artist.name} artist={artist} index={index} />
          ))}
        </div>
        <p className="text-center font-host-grotesk text-groove text-xs md:text-sm mt-4">
          {/* Mobile-friendly hint since hover doesn't exist on touch */}
          Tap an artist for their bio · hover on desktop
        </p>

        {/* CTA → Calendar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12 md:mt-16"
        >
          <a
            href="#calendar"
            onClick={scrollToCalendar}
            className="group inline-flex items-center gap-3 bg-poppy hover:bg-poppy/90 text-plaster font-host-grotesk font-bold px-6 py-3.5 md:px-8 md:py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.03]"
          >
            <span>More shows coming — check the calendar</span>
            <motion.span
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.span>
          </a>
        </motion.div>

       {/* Flyer & Tickets — Clean split view, no bg */}
        <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        viewport={{ once: true }}
        className="mt-12 md:mt-16"
        >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden">
            
            {/* Flyer — full bleed, no crop */}
            <div className="relative h-[420px] lg:h-[560px] overflow-hidden">
            <Image
                src={eventFlyer}
                alt="Event Flyer"
                fill
                className="object-contain"
                priority
            />
            </div>

            {/* Tickets Info — clean, no bg */}
            <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center">
            <h4 className="font-host-grotesk-narrow font-black text-3xl md:text-4xl lg:text-5xl text-rosewood mb-4">
                Get Your Tickets
            </h4>
            
            <p className="font-host-grotesk text-rosewood/60 mb-6 leading-relaxed text-base md:text-lg">
                Dont miss this incredible night of music and art.
            </p>
            
            <Link
                href="https://weedwaster.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 font-host-grotesk font-bold text-plaster bg-rosewood hover:bg-chartreuse hover:text-grove px-10 py-5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.03] text-lg relative overflow-hidden w-full md:w-auto"
            >
                <span className="relative z-10">Get Tickets Now</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
            
            <p className="font-host-grotesk text-rosewood/30 text-sm mt-4">
                weedwaster.com
            </p>
            </div>
        </div>
        </motion.div>
      </div>
    </section>
  )
}
