'use client'

import { motion } from 'framer-motion'
import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SectionContainer } from '@/components/ui/section-container'
import { Reem_Kufi } from 'next/font/google'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Import your images
import shopBG from '@/assets/shopBG.jpg'
import tourBG from '@/assets/tourBG.jpg'
import eventsBG from '@/assets/eventsBG.jpg'
import marketsBG from '@/assets/marketsBG.jpg'
import skillBG from '@/assets/skillBG.jpg'


const reemKufi = Reem_Kufi({ subsets: ['arabic'], weight: '700' })

export function PortalFrames() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const portalLinks = [
    {
      id: 'shop',
      title: 'Shop',
      arabicTitle: 'المتجر',
      subtitle: 'The Store',
      description: 'Handpicked treasures that carry the spirit of home. Each piece tells a story of craftsmanship and heritage.',
      href: '/shop',
      image: shopBG,
      color: 'from-grove/80 to-cypress/70',
    },
    {
      id: 'tours',
      title: 'Tours',
      arabicTitle: 'الجولة',
      subtitle: 'The Journey',
      description: 'Walk with us through the warmth of Florida, gathering like family, sharing stories over good food and deeper connection.',
      href: '/tours',
      image: tourBG,
      color: 'from-rosewood/80 to-henna/70',
    },
    {
      id: 'events',
      title: 'Events',
      arabicTitle: 'الفعاليات',
      subtitle: 'The Gatherings',
      description: 'Where community comes alive. Music, food, laughter, and the feeling of coming home to a place that holds you.',
      href: '/events',
      image: eventsBG,
      color: 'from-poppy/80 to-henna/70',
    },
    {
      id: 'market',
      title: 'The Market',
      arabicTitle: 'السوق',
      subtitle: 'The Marketplace',
      description: 'A vibrant space where local artisans share their craft. Fresh, authentic, and full of life.',
      href: '/market',
      image: marketsBG,
      color: 'from-olive/80 to-grove/70',
    },
    {
      id: 'skill',
      title: 'Skill Share',
      arabicTitle: 'تبادل المهارات',
      subtitle: 'Learn Together',
      description: 'Gather to learn traditional crafts, share knowledge, and keep ancestral skills alive in community.',
      href: '/skill-share',
      image: skillBG,
      color: 'from-henna/80 to-rosewood/70',
    },
  ]

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 400
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount
      
      containerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      })
      setScrollPosition(newPosition)
    }
  }

  return (
    <SectionContainer background="light" spacing="xl" className="relative overflow-hidden">
      
      {/* Warm background - unchanged */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-plaster via-plaster to-sand-dune/50" />
        
        {/* Subtle traditional pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="fabric" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="#295211" />
                <path d="M30 10 L50 30 L30 50 L10 30 Z" fill="#A62630" />
                <circle cx="30" cy="30" r="2" fill="#EFEADE" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fabric)" />
          </svg>
        </div>

        {/* Warm glow effects */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-chartreuse/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-hippie/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="font-period text-md text-henna/60 uppercase tracking-[0.3em] font-semibold">
            Welcome Home
          </span>
          <h2 className="font-period-narrow font-bold text-4xl md:text-6xl text-rosewood mt-3">
            أهلاً وسهلاً
          </h2>
          <p className="font-period text-lg text-rosewood/60 mt-4 max-w-2xl mx-auto">
            Gather around, stay a while. This is a space for community, connection, and the warmth of home.
          </p>
          <div className="w-20 h-0.5 bg-chartreuse mx-auto mt-6" />
        </motion.div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-plaster/80 hover:bg-plaster shadow-lg rounded-full p-3 backdrop-blur-sm transition-all duration-300 -ml-4 md:-ml-6"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-rosewood" />
          </button>
          
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-plaster/80 hover:bg-plaster shadow-lg rounded-full p-3 backdrop-blur-sm transition-all duration-300 -mr-4 md:-mr-6"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-rosewood" />
          </button>

          {/* Cards Container - Horizontal Scroll */}
          <div
            ref={containerRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-6 px-4 md:px-8 hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {portalLinks.map((item, index) => {
              const isHovered = hoveredCard === item.id

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="flex-shrink-0 w-[320px] md:w-[380px]"
                >
                  <Link href={item.href}>
                    <motion.div
                      className="relative rounded-3xl overflow-hidden shadow-xl group cursor-pointer h-[440px]"
                      whileHover={{ 
                        y: -8,
                        transition: { duration: 0.3 }
                      }}
                    >
                      {/* Background Image with Subtle Overlay */}
                      <div className="absolute inset-0">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          priority={index === 0}
                        />
                        {/* Clean gradient overlay - no pattern */}
                        <div className={`absolute inset-0 bg-gradient-to-t ${item.color} z-10`} />
                      </div>

                      {/* Content */}
                      <div className="relative z-20 h-full flex flex-col justify-end p-8">
                        {/* Arabic Title - with Reem Kufi */}
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: isHovered ? 1 : 0.7, x: isHovered ? 0 : -10 }}
                          transition={{ duration: 0.3 }}
                          className={`${reemKufi.className} text-2xl text-plaster/60 mb-1`}
                          dir="rtl"
                        >
                          {item.arabicTitle}
                        </motion.div>

                        {/* English Title */}
                        <h3 className="font-period-narrow font-bold text-3xl md:text-4xl text-plaster mb-1">
                          {item.title}
                        </h3>

                        {/* Subtitle */}
                        <p className="font-period text-sm text-plaster/80 mb-3">
                          {item.subtitle}
                        </p>

                        {/* Description - appears on hover */}
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ 
                            opacity: isHovered ? 1 : 0,
                            height: isHovered ? 'auto' : 0
                          }}
                          transition={{ duration: 0.4 }}
                          className="overflow-hidden"
                        >
                          <p className="font-period text-sm text-plaster/90 leading-relaxed pt-3 border-t border-plaster/20">
                            {item.description}
                          </p>
                          <div className="mt-4 text-plaster/60 font-period text-sm flex items-center gap-2">
                            <span>Explore</span>
                            <span className="inline-block transition-transform group-hover:translate-x-2">→</span>
                          </div>
                        </motion.div>

                        {/* Decorative corner motifs */}
                        <div className="absolute bottom-6 left-6 text-plaster/15 font-period text-lg">
                          ✦
                        </div>
                        <div className="absolute bottom-6 right-6 text-plaster/15 font-period text-lg">
                          ✦
                        </div>
                      </div>

                      {/* Warm border glow on hover */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl border-2 z-30 pointer-events-none"
                        animate={{
                          borderColor: isHovered ? 'rgba(204,209,69,0.4)' : 'rgba(239,234,222,0.1)',
                          boxShadow: isHovered ? '0 20px 60px rgba(52,27,28,0.15)' : 'none',
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Scroll indicator dots */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex justify-center gap-2 mt-8"
        >
          {portalLinks.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-henna/20 transition-all duration-300 hover:bg-henna/40 cursor-pointer"
            />
          ))}
        </motion.div>
      </div>
    </SectionContainer>
  )
}