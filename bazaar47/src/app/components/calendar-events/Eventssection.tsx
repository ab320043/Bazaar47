'use client'

import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Music, ArrowRight, ChevronDown, Ticket, Sparkles, Clock } from 'lucide-react'
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
      <Image
        src={artist.image}
        alt={artist.name}
        fill
        priority={index === 0}
        className="object-cover opacity-90 transition-transform duration-700 ease-out md:group-hover:scale-110 group-data-[active=true]:scale-110"
      />

      <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-plaster px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-md">
        <p className="font-host-grotesk font-bold text-henna text-xs md:text-sm leading-none">
          {artist.time}
        </p>
      </div>

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
            href={artist.ticketUrl}
            className="inline-flex items-center gap-1.5 font-host-grotesk font-semibold text-chartreuse hover:text-plaster transition-colors text-sm"
          >
            <Ticket className="w-3.5 h-3.5" />
            Get Tickets
          </Link>
          
          <Link
            href={`https://${artist.website}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 font-host-grotesk font-semibold text-plaster/60 hover:text-plaster transition-colors text-sm ml-4"
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
  const [flyerHover, setFlyerHover] = useState(false)
  
  return (
    <section className="relative w-full overflow-hidden bg-sand-dune py-16 md:py-20 lg:py-24">
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
        {/* SECTION HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <h2 className="font-host-grotesk-narrow font-black text-4xl md:text-5xl lg:text-6xl text-rosewood leading-tight">
            Upcoming Shows
          </h2>
          <h3 className="pt-6 font-host-grotesk-narrow font-bold text-xl md:text-xl lg:text-2xl text-rosewood leading-tight">Bazaar 47 – Gainesville</h3>
          <div className="w-20 h-0.5 bg-chartreuse mx-auto mt-4" />
        </motion.div>

        {/* Flyer - natural aspect ratio with max constraints */}
        <div className="relative w-full max-w-4xl mx-auto">
          <Image
            src={eventFlyer}
            alt="Event Flyer"
            width={800}
            height={600}
            className="w-1/2 h-auto rounded-2xl shadow-2xl mx-auto"
            priority
          />
          
          {/* Ticket CTA floats below or overlaps */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={showDetails.ticketUrl}
              className="group inline-flex items-center gap-3 font-host-grotesk font-bold text-grove bg-chartreuse hover:bg-plaster px-10 py-5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.03] text-lg"
            >
              <Ticket className="w-5 h-5" />
              Get Tickets Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <span className="font-host-grotesk text-rosewood/50">
              {showDetails.ticketDisplay}
            </span>
          </div>
        </div>

        {/* ARTIST COLLAGE - Add id for anchor */}
        <div id="artists">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <div className="flex flex-col md:flex-row md:h-[640px] lg:h-[720px] rounded-3xl overflow-hidden shadow-2xl">
              {artists.map((artist, index) => (
                <ArtistPanel key={artist.name} artist={artist} index={index} />
              ))}
            </div>
            <p className="text-center font-host-grotesk text-rosewood/40 text-xs md:text-sm mt-4">
              Tap an artist for their bio · hover on desktop
            </p>
          </motion.div>
        </div>

        {/* CALENDAR CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12 md:mt-16"
        >
          <button
            onClick={scrollToCalendar}
            className="group inline-flex items-center gap-3 bg-rosewood hover:bg-chartreuse text-plaster hover:text-grove font-host-grotesk font-bold px-6 py-3.5 md:px-8 md:py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.03]"
          >
            <span>More shows coming — check the calendar</span>
            <motion.span
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.span>
          </button>
        </motion.div>
      </div>
    </section>
  )
}