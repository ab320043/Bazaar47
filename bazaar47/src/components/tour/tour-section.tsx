'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SectionContainer } from '@/components/ui/section-container'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Users, ArrowRight, Ticket } from 'lucide-react'
import { Reem_Kufi } from 'next/font/google'

// Import tour city images - you'll need to add these
import shopBG from '@/assets/shopBG.jpg'

const reemKufi = Reem_Kufi({ subsets: ['arabic'], weight: '700' })

const tourData = [
  {
    city: 'Orlando',
    arabicCity: 'أورلاندو',
    date: 'April 9, 2026',
    time: '6:00 PM',
    venue: 'The Venue Downtown',
    price: '$45',
    capacity: '150 seats',
    image: shopBG,
    color: 'from-cypress/80 to-grove/70',
    description: 'Kick off the tour in the heart of Florida. A night of culture, music, and community gathering.',
    // highlight: 'Opening Night Celebration',
  },
  {
    city: 'Miami',
    arabicCity: 'ميامي',
    date: 'April 11, 2026',
    time: '7:00 PM',
    venue: 'Miami Cultural Center',
    price: '$55',
    capacity: '200 seats',
    image: shopBG,
    color: 'from-hippie/80 to-henna/70',
    description: 'Experience the fusion of Palestinian heritage and Miami\'s vibrant energy. A night to remember.',
    // highlight: 'Special Guest Performance',
  },
  {
    city: 'Jacksonville',
    arabicCity: 'جاكسونفيل',
    date: 'April 13, 2026',
    time: '6:30 PM',
    venue: 'Jacksonville Arts Hub',
    price: '$40',
    capacity: '120 seats',
    image: shopBG,
    color: 'from-olive/80 to-grove/70',
    description: 'Intimate gathering with storytelling, traditional music, and community connection.',
    // highlight: 'Storytelling Night',
  },
  {
    city: 'Tampa',
    arabicCity: 'تامبا',
    date: 'April 15, 2026',
    time: '7:30 PM',
    venue: 'Tampa Community Space',
    price: '$50',
    capacity: '180 seats',
    image: shopBG,
    color: 'from-henna/80 to-rosewood/70',
    description: 'A celebration of culture with food, music, and the warmth of community. Bring your family.',
    // highlight: 'Cultural Feast',
  },
  {
    city: 'Gainesville',
    arabicCity: 'غينزفيل',
    date: 'April 17, 2026',
    time: '6:00 PM',
    venue: 'Gainesville Arts Center',
    price: '$35',
    capacity: '100 seats',
    image: shopBG,
    color: 'from-chartreuse/80 to-grove/70',
    description: 'Closing night under the Florida stars. A heartfelt gathering to end the tour.',
    // highlight: 'Closing Celebration',
  },
]

export function TourSection() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)

  return (
    <SectionContainer background="dark" spacing="xl" className="relative overflow-hidden">
      
      {/* Dramatic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-rosewood via-rosewood to-grove" />
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.05]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tour-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="#CCD145" />
                <circle cx="40" cy="40" r="3" fill="#FFB0BC" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tour-pattern)" />
          </svg>
        </div>

        {/* Warm glow effects */}
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-chartreuse/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-hippie/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Section Header - More dramatic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-period text-md text-chartreuse/60 uppercase tracking-[0.3em] font-semibold">
            Bazaar à la Carte
          </span>
          <h2 className="font-period-narrow font-bold text-5xl md:text-7xl text-plaster mt-3">
            Florida Tour 2026
          </h2>
          <div className={`${reemKufi.className} text-3xl text-white mt-2`} dir="rtl">
            جولة فلوريدا ٢٠٢٦
          </div>
          <p className="font-period text-lg text-plaster/50 mt-4 max-w-2xl mx-auto">
            Five cities. One unforgettable journey. Join us as we bring the warmth of home to Florida.
          </p>
          <div className="w-20 h-0.5 bg-chartreuse mx-auto mt-6" />
        </motion.div>

        {/* Tour Cards - Two per row on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tourData.map((stop, index) => {
            const isHovered = hoveredCity === stop.city

            return (
              <motion.div
                key={stop.city}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                onMouseEnter={() => setHoveredCity(stop.city)}
                onMouseLeave={() => setHoveredCity(null)}
                className="relative group"
              >
                <motion.div
                  className="relative rounded-3xl overflow-hidden shadow-2xl cursor-pointer h-[380px] md:h-[340px]"
                  whileHover={{ 
                    y: -8,
                    scale: 1.01,
                    transition: { duration: 0.3 }
                  }}
                >
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={stop.image}
                      alt={stop.city}
                      fill
                      className="object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${stop.color} z-10`} />
                    <div className="absolute inset-0 bg-rosewood/20 z-10" />
                  </div>

                  {/* Highlight Badge */}
                  {/* <div className="absolute top-4 right-4 z-20 bg-chartreuse/90 text-grove font-period text-xs font-bold px-3 py-1.5 rounded-full tracking-wider">
                    {stop.highlight}
                  </div> */}

                  {/* Date Badge */}
                  <div className="absolute top-4 left-4 z-20 bg-plaster/10 backdrop-blur-sm text-plaster font-period text-xs px-3 py-1.5 rounded-full border border-plaster/20 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {stop.date}
                  </div>

                  {/* Content */}
                  <div className="relative z-20 h-full flex flex-col justify-end p-8">
                    {/* Arabic City Name */}
                    <div className={`${reemKufi.className} text-2xl text-plaster/40 mb-1`} dir="rtl">
                      {stop.arabicCity}
                    </div>

                    {/* City Name */}
                    <h3 className="font-period-narrow font-bold text-4xl text-plaster mb-2">
                      {stop.city}
                    </h3>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <p className="font-period text-sm text-plaster/70 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {stop.venue}
                      </p>
                      <p className="font-period text-sm text-plaster/70 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {stop.time}
                      </p>
                      <p className="font-period text-sm text-plaster/70 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {stop.capacity}
                      </p>
                    </div>

                    {/* Price & CTA */}
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="font-period-narrow font-bold text-3xl text-plaster">
                          {stop.price}
                        </span>
                        <span className="font-period text-xs text-plaster/40 ml-1">/ ticket</span>
                      </div>
                      <Button 
                        variant="primary" 
                        size="default"
                        className="bg-plaster text-rosewood hover:bg-plaster/90 px-6 py-2 rounded-full group"
                        onClick={() => console.log(`Tickets for ${stop.city}`)}
                      >
                        Get Tickets
                        <Ticket className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>

                    {/* Description - Appears on Hover */}
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: isHovered ? 1 : 0,
                        height: isHovered ? 'auto' : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden mt-3"
                    >
                      <p className="font-period text-sm text-plaster/80 leading-relaxed pt-3 border-t border-plaster/20">
                        {stop.description}
                      </p>
                    </motion.div>

                    {/* Decorative corner */}
                    <div className="absolute bottom-6 right-6 text-plaster/10 font-period text-2xl">
                      ✦
                    </div>
                  </div>

                  {/* Glow border on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl border-2 z-30 pointer-events-none"
                    animate={{
                      borderColor: isHovered ? 'rgba(204,209,69,0.4)' : 'rgba(239,234,222,0.1)',
                      boxShadow: isHovered ? '0 20px 60px rgba(204,209,69,0.1)' : 'none',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA - View Full Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex flex-col items-center gap-4">
            <div className="flex items-center gap-6 text-plaster/40 font-period text-sm">
              <span>✦ Limited seating available</span>
              <span className="w-px h-4 bg-plaster/20" />
              <span>✦ Early bird pricing</span>
              <span className="w-px h-4 bg-plaster/20" />
              <span>✦ Group discounts</span>
            </div>
            
            <Link href="/tours">
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-transparent hover:bg-plaster/10 text-plaster border-2 border-plaster/30 hover:border-plaster/50 px-8 py-4 rounded-full group"
              >
                <span>View Full Tour Schedule</span>
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>

            <p className="font-period text-xs text-plaster/30 mt-2">
              Produced by Bazaar 47 • Florida Tour 2026
            </p>
          </div>
        </motion.div>
      </div>
    </SectionContainer>
  )
}