'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'
import banner from '@/assets/newAssets/banner.png'

// Import tour city images
import casselberry from '@/assets/casselberry.jpg'
import MAD from '@/assets/MAD.jpg'
// import artWalk from '@/assets/artWalk.jpeg'
import Jacks from '@/assets/newAssets/Jacks.png'
import dtGnv from '@/assets/dtGnv.jpg'
import Camp from '@/assets/Camp.jpg'
import howBazaar from '@/assets/howBazaar.jpg'

import cardLocationIcon from '@/assets/newAssets/cardLocationIcon.png'
import cardClockIcon from '@/assets/newAssets/cardClockIcon.png'

const tourData = [
  {
    id: 'orlando',
    city: 'Orlando',
    date: 'Saturday, August 8',
    time: '6-10pm',
    venue: 'Casselberry Arts Center',
    description: 'Kick off the Florida Tour at Casselberry Arts Center. A night of culture, community, and creative connection.',
    price: 'RSVP',
    badge: 'Free',
    image: casselberry,
  },
  {
    id: 'south-florida',
    city: 'South Florida',
    date: 'Saturday, September 12',
    time: '6-11pm',
    venue: 'MAD Arts',
    description: 'Experience the fusion of Palestinian heritage and South Florida\'s vibrant energy. A night to remember.',
    price: 'Buy Pre-Sales',
    badge: '$5-$10',  // ← Custom badge for South Florida
    image: MAD,
  },
  {
    id: 'jacksonville',
    city: 'Jacksonville',
    date: 'Saturday, October 7',
    time: '5-9pm',
    venue: 'Third Wednesday Art Walk',
    description: 'Intimate gathering during the Art Walk with storytelling, traditional music, and community connection.',
    price: 'RSVP',
    badge: 'Free',
    image: Jacks,
  },
  {
    id: 'gainesville-fest',
    city: 'Gainesville | The Fest',
    date: 'Saturday, October 24',
    time: '2-8pm',
    venue: 'Downtown, Gainesville',
    description: 'Join us during the FEST for an afternoon of culture, music, and community in the heart of Gainesville.',
    price: 'RSVP',
    badge: 'Free',
    image: dtGnv,
  },
  {
    id: 'tampa',
    city: 'Tampa',
    date: 'Saturday, November 21',
    time: '5-10pm',
    venue: 'CAMP Tampa',
    description: 'A celebration of culture with food, music, and the warmth of community. Bring your family and friends.',
    price: 'RSVP',
    badge: 'Free',
    image: Camp,
  },
  {
    id: 'gainesville-finale',
    city: 'Gainesville',
    date: 'Saturday, December 5',
    time: '5-10pm',
    venue: 'Bazaar47',
    description: 'Closing night where it all began. A heartfelt gathering under the stars to celebrate community and connection.',
    price: 'RSVP',
    badge: 'Free',
    image: howBazaar,
  },
]

export function TourSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#6A2630]" id="tour-section">

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

      <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-20">
        
        {/* ============================================
            HEADER - Tickets + Dates with Banner
            ============================================ */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
          <div className="md:w-1/2">
            <h2 className="font-host-grotesk font-bold text-[58px] leading-[108%] tracking-normal text-plaster mt-4">
              Tickets + Dates
            </h2>
          </div>
          <div className="md:w-1/2 flex justify-end">
            <div className="relative w-full max-w-30 h-auto" style={{ right: '20px', top: '6px' }}>
              <Image
                src={banner}
                alt="Bazaar À La Carte"
                className="object-contain w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* ============================================
            TOUR CARDS - 2x3 Grid
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tourData.map((stop, index) => (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="mx-auto w-full max-w-110 aspect-[0.76] rounded-[15px] border-2 border-[#341B1C] bg-plaster overflow-hidden"
            >
              {/* ============================================
                  TOP HALF - Image (50%)
                  ============================================ */}
              <div className="relative h-1/2 w-full">
                <Image
                  src={stop.image}
                  alt={stop.city}
                  fill
                  className="object-cover"
                />
              </div>

              {/* ============================================
                  BOTTOM HALF - Content (50%)
                  ============================================ */}
              <div className="flex h-1/2 flex-col bg-plaster px-4 py-4">
                
                {/* City + Badge Row */}
                <div className="flex items-center justify-between">
                  <h3 className="font-host-grotesk text-[30px] font-bold text-[#341B1C] leading-none">
                    {stop.city}
                  </h3>
                  <span className={`rounded-full px-4 py-2 text-[18px] font-bold leading-none ${
                    stop.badge === '$5-$10' 
                      ? 'bg-chartreuse text-[#295211]' 
                      : 'bg-chartreuse text-[#295211]'
                  }`}>
                    {stop.badge}
                  </span>
                </div>

                {/* Date */}
                <p className="mt-2 font-host-grotesk text-[18px] font-semibold text-[#341B1C]">
                  {stop.date}
                </p>

                {/* Location + Time */}
                <div className="mt-4 flex items-center gap-5 text-[#341B1C]">
                  <div className="flex items-center gap-2">
                    <Image src={cardLocationIcon} alt="Location" width={18} height={18} className="text-poppy" />
                    <span className="font-host-grotesk text-sm font-semibold">{stop.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-poppy" />
                    <span className="font-host-grotesk text-sm font-semibold">{stop.time}</span>
                  </div>
                </div>

                {/* Divider */}
                <hr className="my-4 border-[#341B1C]/20" />

                {/* Description */}
                <p className="font-host-grotesk text-[14px] font-normal leading-[100%] tracking-[0] text-[#341B1C]">
                  {stop.description}
                </p>

                {/* Divider */}
                <hr className="my-4 border-[#341B1C]/20" />

                {/* Button - Full Width */}
                <Link href={`/tours/${stop.id}`} className="w-full">
                  <button className="w-full rounded-2xl bg-[#341B1C] h-14 text-center font-host-grotesk text-[20px] font-semibold text-plaster transition hover:opacity-90">
                    {stop.price} →
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}