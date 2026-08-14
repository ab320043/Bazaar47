// EventsListing.tsx
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Clock, ArrowRight, Music } from 'lucide-react'
import { events, type Event } from './events-config'
import overlay from '@/assets/newAssets/overlay.png'

function EventCard({ event, index }: { event: Event; index: number }) {
  const isBazaar47 = event.id === 'bazaar47'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group bg-henna rounded-2xl overflow-hidden border border-plaster/10 hover:border-plaster/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
    >
      <div className="flex flex-col md:flex-row">
        {/* Flyer - Left */}
        <div className="relative md:w-56 lg:w-64 h-56 md:h-auto flex-shrink-0 overflow-hidden">
          <Image
            src={event.flyerImage}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content - Right */}
        <div className="flex-1 p-6 md:p-8 flex flex-col bg-henna">
          <div className="flex-1">
            {event.subtitle && (
              <p className="font-host-grotesk font-semibold text-plaster/40 text-xs uppercase tracking-wider mb-1">
                {event.subtitle}
              </p>
            )}
            <h3 className="font-host-grotesk font-black text-2xl md:text-3xl text-plaster mb-3">
              {event.title}
            </h3>
            
            <div className="flex flex-wrap gap-4 text-plaster/60 text-sm mb-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {event.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {event.time}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {event.location}
              </span>
            </div>

            <p className="font-host-grotesk text-plaster/70 text-sm leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-6 border-t border-plaster/10">
            <Link
              href={`/tickets/UpcomingShows?event=${event.id}`}
              className="inline-flex items-center gap-2 font-host-grotesk font-bold text-henna bg-plaster hover:bg-sand-dune px-6 py-3 rounded-xl transition-all duration-300 hover:scale-[1.03] text-sm"
            >
              <Music className="w-4 h-4" />
              {isBazaar47 ? 'Get Tickets' : 'RSVP Now'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function EventsListing() {
  return (
    <section id="events" className="relative w-full bg-sand-dune py-16 md:py-20">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <Image
          src={overlay}
          alt=""
          fill
          className="object-cover"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-host-grotesk-narrow font-black text-4xl md:text-5xl text-rosewood">
            Upcoming Events
          </h2>
          <div className="w-16 h-0.5 bg-chartreuse mx-auto mt-4" />
        </motion.div>

        {/* Events list */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}