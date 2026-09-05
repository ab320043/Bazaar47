// app/components/calendar-events/WorkshopsListing.tsx
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Clock, ArrowRight, Ticket, ExternalLink, Sparkles, DollarSign, Users, Flame, PartyPopper } from 'lucide-react'
import { workshops, type Workshop } from './workshops-data'
import overlay from '@/assets/newAssets/overlay.png'

function WorkshopCard({ workshop, index }: { workshop: Workshop; index: number }) {
  const isFree = workshop.ticketType === 'free-rsvp'
  const isExternal = workshop.ticketType === 'external-link'
  const isSlidingScale = workshop.id === 'figure-drawing'

  const getActionButton = () => {
    if (isFree) {
      return (
        <Link
          href={`/tickets/UpcomingShows?event=paper-butterflies`}
          className="inline-flex items-center gap-2 font-host-grotesk font-bold text-henna bg-chartreuse hover:bg-plaster px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.03] text-sm"
        >
          <Users className="w-4 h-4" />
          RSVP Free
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )
    }
    
    if (isExternal && workshop.externalLink) {
      return (
        <a
          href={workshop.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-host-grotesk font-bold text-henna bg-plaster hover:bg-sand-dune px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.03] text-sm"
        >
          <Ticket className="w-4 h-4" />
          Get Tickets
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )
    }

    const eventMap: Record<string, string> = {
      'tatreez': 'tatreez',
      'painting': 'painting',
      'figure-drawing': 'figure-drawing'
    }
    
    return (
      <Link
        href={`/tickets/UpcomingShows?event=${eventMap[workshop.id]}`}
        className="inline-flex items-center gap-2 font-host-grotesk font-bold text-henna bg-plaster hover:bg-sand-dune px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.03] text-sm"
      >
        <Ticket className="w-4 h-4" />
        {isSlidingScale ? 'Choose Price' : `Get Tickets — ${workshop.price}`}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      viewport={{ once: true }}
      className={`group ${workshop.color} rounded-2xl overflow-hidden border-2 border-plaster/10 hover:border-plaster/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}
    >
      <div className="p-5 md:p-6">
        {/* Header with icon and price */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plaster/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{workshop.icon}</span>
            </div>
            <div>
              <p className={`font-host-grotesk font-semibold ${workshop.textColor}/50 text-[10px] uppercase tracking-wider`}>
                {workshop.table}
              </p>
              <h3 className={`font-host-grotesk font-black text-lg md:text-xl ${workshop.textColor} leading-tight`}>
                {workshop.title}
              </h3>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className={`font-host-grotesk font-black text-xl ${workshop.textColor}`}>
              {workshop.price}
            </span>
            {workshop.priceNote && (
              <p className={`font-host-grotesk text-[10px] ${workshop.textColor}/40`}>
                {workshop.priceNote}
              </p>
            )}
          </div>
        </div>

        {/* Time */}
        <div className={`flex items-center gap-2 ${workshop.textColor}/60 text-sm mb-3`}>
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="font-host-grotesk">{workshop.time}</span>
        </div>

        {/* Description */}
        <p className={`font-host-grotesk ${workshop.textColor}/70 text-sm leading-relaxed mb-4`}>
          {workshop.description}
        </p>

        {/* Action */}
        <div className={`flex items-center justify-between pt-4 border-t ${workshop.textColor}/10`}>
          <div className="flex items-center gap-2">
            {isFree && (
              <span className="flex items-center gap-1.5 font-host-grotesk font-bold text-chartreuse text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Free RSVP
              </span>
            )}
            {workshop.ticketType === 'paid-ticket' && (
              <span className={`flex items-center gap-1.5 font-host-grotesk ${workshop.textColor}/40 text-xs`}>
                <DollarSign className="w-3.5 h-3.5" />
                {isSlidingScale ? 'Sliding scale' : 'Reserve your spot'}
              </span>
            )}
            {isExternal && (
              <span className={`flex items-center gap-1.5 font-host-grotesk ${workshop.textColor}/40 text-xs`}>
                <ExternalLink className="w-3.5 h-3.5" />
                External ticketing
              </span>
            )}
          </div>
          {getActionButton()}
        </div>
      </div>
    </motion.div>
  )
}

export function WorkshopsListing() {
  const eventDate = 'Saturday, September 12, 2026'
  const eventLocation = 'MAD Arts · Broward, FL'

  return (
    <section id="workshops" className="relative w-full bg-sand-dune py-16 md:py-20">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <Image
          src={overlay}
          alt=""
          fill
          className="object-cover"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-12 h-px bg-rosewood/30" />
            <span className="font-host-grotesk text-xs text-rosewood/60 uppercase tracking-[0.3em] font-bold flex items-center gap-2">
              <Flame className="w-3 h-3 text-chartreuse" />
              Bazaar47 South Florida Tour
              <Flame className="w-3 h-3 text-chartreuse" />
            </span>
            <span className="w-12 h-px bg-rosewood/30" />
          </div>
          
          <h2 className="font-host-grotesk-narrow font-black text-4xl md:text-5xl lg:text-6xl text-rosewood leading-tight">
            Join the Experience
          </h2>
          <p className="font-host-grotesk text-xl text-rosewood/70 mt-3 max-w-2xl mx-auto">
            Be part of something special —{' '}
            <span className="text-rosewood font-bold">6 interactive workshops</span>{' '}
            crafted for creativity, connection, and community.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-rosewood/50 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {eventDate}
            </span>
            <span className="w-px h-4 bg-rosewood/20" />
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {eventLocation}
            </span>
          </div>
          
          {/* <div className="w-16 h-0.5 bg-chartreuse mx-auto mt-4" /> */}
        </motion.div>

        {/* Workshops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workshops.map((workshop, index) => (
            <WorkshopCard key={workshop.id} workshop={workshop} index={index} />
          ))}
        </div>
        
        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12 pt-8 border-t border-rosewood/10"
        >
          <p className="font-host-grotesk text-rosewood/40 text-sm flex items-center justify-center gap-2">
            <PartyPopper className="w-4 h-4" />
            From art to activism, clay to cross-stitch — there is something for everyone
            <PartyPopper className="w-4 h-4" />
          </p>
        </motion.div>
      </div>
    </section>
  )
}