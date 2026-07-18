'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SectionContainer } from '@/components/ui/section-container'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, ArrowRight} from 'lucide-react'
import { Reem_Kufi } from 'next/font/google'

// Import tour city images
import casselberry from '@/assets/casselberry.jpg'
import MAD from '@/assets/MAD.jpg'
import artWalk from '@/assets/artWalk.jpeg'
import dtGnv from '@/assets/dtGnv.jpg'
import Camp from '@/assets/Camp.jpg'
import howBazaar from '@/assets/howBazaar.jpg'

import { VendorApplication } from './vendor-application'

const reemKufi = Reem_Kufi({ subsets: ['arabic'], weight: '700' })

const tourData = [
  {
    id: 'orlando',
    city: 'Orlando',
    arabicCity: 'أورلاندو',
    date: 'Saturday, August 8th',
    time: '6:00pm — 10:00pm',
    venue: 'Casselberry Arts Center',
    address: '127 Quail Pond Cir, Casselberry, FL 32707',
    price: 'FREE RSVP',
    priceNote: 'collect emails + city they\'re from',
    image: casselberry,
    color: 'from-grove/90 to-cypress/70',
    description: 'Kick off the Florida Tour at Casselberry Arts Center. A night of culture, community, and creative connection.',
    afterparty: 'TBA',
  },
  {
    id: 'south-florida',
    city: 'South Florida',
    arabicCity: 'جنوب فلوريدا',
    date: 'Saturday, September 12',
    time: '6:00pm — 11:00pm',
    venue: 'MAD Arts',
    address: 'Broward County',
    price: '$5 Pre-sale / $10 Day of',
    priceNote: '',
    image: MAD,
    color: 'from-henna/90 to-rosewood/70',
    description: 'Experience the fusion of Palestinian heritage and South Florida\'s vibrant energy. A night to remember.',
    afterparty: '',
  },
  {
    id: 'jacksonville',
    city: 'Jacksonville',
    arabicCity: 'جاكسونفيل',
    date: 'Wednesday, October 7',
    time: '5:00pm — 9:00pm',
    venue: 'Third Wednesday Art Walk',
    address: 'Downtown Jacksonville',
    price: 'FREE RSVP',
    priceNote: '',
    image: artWalk,
    color: 'from-olive/90 to-grove/70',
    description: 'Intimate gathering during the Art Walk with storytelling, traditional music, and community connection.',
    afterparty: 'TBA',
  },
  {
    id: 'gainesville-fest',
    city: 'Gainesville | The FEST',
    arabicCity: 'غينزفيل - المهرجان',
    date: 'Saturday, October 24',
    time: '2:00pm — 8:00pm',
    venue: 'Downtown Gainesville',
    address: 'During The FEST',
    price: 'FREE RSVP',
    priceNote: 'Tickets for The Fest at thefestfl.com',
    image: dtGnv,
    color: 'from-chartreuse/90 to-grove/70',
    description: 'Join us during The FEST for an afternoon of culture, music, and community in the heart of Gainesville.',
    afterparty: '',
  },
  {
    id: 'tampa',
    city: 'Tampa',
    arabicCity: 'تامبا',
    date: 'Saturday, November 21',
    time: '5:00pm — 10:00pm',
    venue: 'CAMP Tampa',
    address: '3012 W Palmira Ave, Tampa, FL 33629',
    price: 'FREE RSVP',
    priceNote: '',
    image: Camp,
    color: 'from-cypress/90 to-grove/70',
    description: 'A celebration of culture with food, music, and the warmth of community. Bring your family and friends.',
    afterparty: '',
  },
  {
    id: 'gainesville-finale',
    city: 'Gainesville',
    arabicCity: 'غينزفيل',
    date: 'Saturday, December 5',
    time: '5:00pm — 10:00pm',
    venue: 'Bazaar47',
    address: '60 SW 2nd Street, Downtown Gainesville, FL 32601',
    price: 'FREE RSVP',
    priceNote: '',
    image: howBazaar,
    color: 'from-rosewood/90 to-grove/70',
    description: 'Closing night where it all began. A heartfelt gathering under the stars to celebrate community and connection.',
    afterparty: '',
  },
]

export function TourSection() {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)

  return (
    <div className="relative overflow-hidden">
      
      {/* ============================================
          HENNA BACKGROUND - Header Section Only
          ============================================ */}
      <div className="bg-henna">
        <div className="container mx-auto px-4 max-w-4xl py-16 md:py-20">
          
          {/* Section Header - Newspaper Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="border-b-2 border-plaster/10 pb-8"
          >
            <div className="flex items-center gap-4 mb-2">
              <span className="w-12 h-px bg-chartreuse/60" />
              <span className="font-period text-xs text-petal uppercase tracking-[0.3em] font-bold">
                Bazaar À La Carte
              </span>
              <span className="w-12 h-px bg-chartreuse/60" />
            </div>
            
            <h1 className="font-period-narrow font-black text-5xl md:text-6xl lg:text-7xl text-rosewood leading-tight">
              Florida Tour 2026
            </h1>
            
            <div className={`${reemKufi.className} text-3xl md:text-4xl text-petal mt-1`} dir="rtl">
              جولة فلوريدا ٢٠٢٦
            </div>
            
            <div className="mt-4 space-y-3 max-w-2xl">
              <p className="font-period text-base md:text-lg text-rosewood leading-relaxed">
                <b>Bazaar À La Carte</b> is a night market hosted by Bazaar47, a community and cultural space in Downtown Gainesville, Florida. Our market is specifically curated to give creatives an opportunity to share and sell their valuable work in a nurturing, low-risk/high-reward environment.
              </p>
              <p className="font-period text-base md:text-lg text-rosewood leading-relaxed">
                We welcome vendors within all stages of experience to join us, as we know many people are experimenting with creating and selling.
              </p>
              <p className="font-period text-base md:text-lg text-rosewood leading-relaxed">
                Our goal is to create a supportive ecosystem of creators and buyers who both value mindful consumption, craftsmanship, and sustainability 
                <span className="block font-period text-lg text-chartreuse font-black italic mt-1 flex items-center justify-center gap-2">
                  kind of like an alternative local economy, ya know?
                </span>
              </p>
              <p className="font-period text-base md:text-lg text-rosewood leading-relaxed">
                Bazaar À La Carte has grown so much in Gainesville that we expanded our night market throughout Florida with the help of amazing collaborators in each community we will be visiting.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-plaster/60 font-period font-bold">
              <span>✦ August — December 2026</span>
              <span className="hidden sm:inline">•</span>
              <span>✦ 6 Cities Across Florida</span>
              <span className="hidden sm:inline">•</span>
              <span>✦ Second Annual Tour</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ============================================
          PLASTER BACKGROUND - Cards Section
          ============================================ */}
      <div className="bg-plaster">
        <div className="container mx-auto px-4 max-w-4xl py-16 md:py-20">
          
          {/* Timeline Tour Cards */}
          <div className="space-y-12 md:space-y-16">
            {tourData.map((stop, index) => {
              const isHovered = hoveredCity === stop.id

              return (
                <motion.div
                  key={stop.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  onMouseEnter={() => setHoveredCity(stop.id)}
                  onMouseLeave={() => setHoveredCity(null)}
                  className="relative"
                >
                  {/* Timeline connector line */}
                  {index < tourData.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-chartreuse/30 via-chartreuse/10 to-transparent" />
                  )}
                  
                  {/* Timeline dot with number */}
                  <div className="absolute left-6 top-6 -translate-x-1/2 z-20 flex items-center justify-center">
                    <div className={`
                      w-12 h-12 rounded-full border-2 flex items-center justify-center
                      ${isHovered ? 'border-chartreuse bg-chartreuse/10' : 'border-rosewood/20 bg-plaster'}
                      transition-all duration-300 shadow-md
                    `}>
                      <span className={`
                        font-period-narrow font-bold text-sm
                        ${isHovered ? 'text-chartreuse' : 'text-rosewood/40'}
                        transition-colors duration-300
                      `}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Card */}
                  <motion.div
                    className="relative rounded-3xl overflow-hidden shadow-lg ml-16 md:ml-20 border border-rosewood/5"
                    whileHover={{ 
                      y: -4,
                      boxShadow: '0 20px 60px rgba(52,27,28,0.08)',
                      transition: { duration: 0.3 }
                    }}
                  >
                    <div className="relative bg-white">
                      {/* Background Image with Overlay */}
                      <div className="relative h-[280px] md:h-[320px] overflow-hidden">
                        <Image
                          src={stop.image}
                          alt={stop.city}
                          fill
                          className="object-cover"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${stop.color} z-10`} />
                        <div className="absolute inset-0 bg-rosewood/10 z-10" />
                        
                        {/* Arabic City Name */}
                        <div className={`${reemKufi.className} absolute top-6 right-6 z-20 text-3xl md:text-4xl text-plaster/30`} dir="rtl">
                          {stop.arabicCity}
                        </div>

                        {/* City Number */}
                        <div className="absolute bottom-6 left-6 z-20 font-period-narrow font-black text-7xl md:text-8xl text-plaster/5">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        {/* Content - Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8">
                          <h3 className="font-period-narrow font-black text-4xl md:text-5xl text-plaster mb-1">
                            {stop.city}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-3 text-plaster/80 font-period text-sm">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {stop.date}
                            </span>
                            <span className="hidden sm:inline text-plaster/30">•</span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {stop.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="p-6 md:p-8 bg-plaster">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <p className="font-period font-bold text-sm text-rosewood/60 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {stop.venue}
                            </p>
                            <p className="font-period text-sm text-rosewood/40 pl-6">
                              {stop.address}
                            </p>
                            
                            {/* Description */}
                            <p className="font-period text-sm text-rosewood/60 mt-3 leading-relaxed border-t border-rosewood/10 pt-3">
                              {stop.description}
                            </p>
                            
                            {stop.afterparty && (
                              <p className="font-period text-xs text-chartreuse/70 mt-1 flex items-center gap-1">
                                <span>✦</span>
                                Afterparty: {stop.afterparty}
                              </p>
                            )}
                          </div>

                          {/* Price & CTA */}
                          <div className="flex-shrink-0 flex flex-col items-end gap-3">
                            <div className="text-right">
                              <span className="font-period-narrow font-black text-2xl text-rosewood">
                                {stop.price}
                              </span>
                              {stop.priceNote && (
                                <p className="font-period text-xs text-rosewood/40">
                                  {stop.priceNote}
                                </p>
                              )}
                            </div>
                            <Link href={`/tours/${stop.id}`}>
                              <Button 
                                variant="primary" 
                                size="default"
                                className="bg-rosewood hover:bg-rosewood/80 text-plaster px-6 py-2.5 rounded-full group font-bold"
                              >
                                Learn More
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>

          {/* Vendor Application Section */}
          <div className="mt-24 border-t-2 border-rosewood/10 pt-12">
            <VendorApplication />
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-16 pt-8 border-t-2 border-rosewood/10"
          >
            <p className="font-period font-semibold text-lg text-rosewood">
              Produced by Bazaar47 • Florida Tour 2026 • Gainesville, FL
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  )
}