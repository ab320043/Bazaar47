'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  const [showArabic, setShowArabic] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowArabic((prev) => !prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative h-screen min-h-[700px] flex flex-col overflow-hidden bg-rosewood dark:bg-grove">
      
      {/* ============================================
          TOP SECTION - Animated Pattern (Faster)
          ============================================ */}
      <div className="relative flex-1 overflow-hidden">
        {/* Gradient overlay from bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-rosewood/90 dark:to-grove/90 z-10" />
        
        {/* Persian Carpet / Olive Leaf Pattern - Faster Marquee */}
        <div className="absolute inset-0 flex items-center">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{
              x: ['0%', '-50%'],
            }}
            transition={{
              duration: 35, // Faster than before
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Pattern Strip 1 */}
            <div className="flex h-full">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[350px] h-full">
                  <svg className="w-full h-full" viewBox="0 0 350 450" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <pattern id={`carpet-${i}`} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                        {/* Persian Carpet / Olive Leaf Pattern */}
                        
                        {/* Background */}
                        <rect width="120" height="120" fill="none" />
                        
                        {/* Diamond medallion */}
                        <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="#CCD145" opacity="0.15" />
                        <path d="M60 15 L105 60 L60 105 L15 60 Z" fill="#FFB0BC" opacity="0.1" />
                        
                        {/* Olive leaf shapes */}
                        <path d="M30 30 C45 20 55 25 60 40 C65 25 75 20 90 30 C80 45 85 55 70 60 C85 65 80 75 90 90 C75 80 65 85 60 70 C55 85 45 80 30 90 C40 75 35 65 50 60 C35 55 40 45 30 30 Z" 
                              fill="#A62630" opacity="0.12" />
                        
                        <path d="M30 30 C45 20 55 25 60 40 C65 25 75 20 90 30 C80 45 85 55 70 60 C85 65 80 75 90 90 C75 80 65 85 60 70 C55 85 45 80 30 90 C40 75 35 65 50 60 C35 55 40 45 30 30 Z" 
                              fill="#EFEADE" opacity="0.08" transform="rotate(45 60 60)" />
                        
                        {/* Smaller olive leaves */}
                        <path d="M15 15 C25 10 30 15 25 25 C30 20 35 25 25 35 C35 30 40 35 30 45 C20 40 15 35 20 25 C15 30 10 25 15 15 Z" 
                              fill="#D5C9B1" opacity="0.15" />
                        
                        <path d="M105 15 C115 10 120 15 115 25 C120 20 125 25 115 35 C125 30 130 35 120 45 C110 40 105 35 110 25 C105 30 100 25 105 15 Z" 
                              fill="#D5C9B1" opacity="0.15" />
                        
                        <path d="M15 105 C25 100 30 105 25 115 C30 110 35 115 25 125 C35 120 40 125 30 135 C20 130 15 125 20 115 C15 120 10 115 15 105 Z" 
                              fill="#D5C9B1" opacity="0.15" />
                        
                        <path d="M105 105 C115 100 120 105 115 115 C120 110 125 115 115 125 C125 120 130 125 120 135 C110 130 105 125 110 115 C105 120 100 115 105 105 Z" 
                              fill="#D5C9B1" opacity="0.15" />
                        
                        {/* Border ornaments */}
                        <rect x="5" y="5" width="110" height="110" fill="none" stroke="#295211" strokeWidth="0.5" opacity="0.1" />
                        <rect x="10" y="10" width="100" height="100" fill="none" stroke="#CCD145" strokeWidth="0.5" opacity="0.1" />
                        
                        {/* Small dots */}
                        <circle cx="60" cy="60" r="3" fill="#FFB0BC" opacity="0.2" />
                        <circle cx="0" cy="0" r="3" fill="#CCD145" opacity="0.15" />
                        <circle cx="120" cy="120" r="3" fill="#CCD145" opacity="0.15" />
                        <circle cx="0" cy="120" r="3" fill="#CCD145" opacity="0.15" />
                        <circle cx="120" cy="0" r="3" fill="#CCD145" opacity="0.15" />
                        
                        {/* Cross patterns */}
                        <path d="M50 50 L70 50 L70 70 L50 70 Z" fill="#A62630" opacity="0.08" />
                        <path d="M40 40 L80 40 L80 80 L40 80 Z" fill="none" stroke="#EFEADE" strokeWidth="0.5" opacity="0.08" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#carpet-${i})`} />
                  </svg>
                </div>
              ))}
            </div>
            {/* Duplicate for seamless loop */}
            <div className="flex h-full">
              {[...Array(10)].map((_, i) => (
                <div key={`dup-${i}`} className="flex-shrink-0 w-[350px] h-full">
                  <svg className="w-full h-full" viewBox="0 0 350 450" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <pattern id={`carpet-dup-${i}`} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                        <rect width="120" height="120" fill="none" />
                        <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="#CCD145" opacity="0.15" />
                        <path d="M60 15 L105 60 L60 105 L15 60 Z" fill="#FFB0BC" opacity="0.1" />
                        <path d="M30 30 C45 20 55 25 60 40 C65 25 75 20 90 30 C80 45 85 55 70 60 C85 65 80 75 90 90 C75 80 65 85 60 70 C55 85 45 80 30 90 C40 75 35 65 50 60 C35 55 40 45 30 30 Z" 
                              fill="#A62630" opacity="0.12" />
                        <path d="M30 30 C45 20 55 25 60 40 C65 25 75 20 90 30 C80 45 85 55 70 60 C85 65 80 75 90 90 C75 80 65 85 60 70 C55 85 45 80 30 90 C40 75 35 65 50 60 C35 55 40 45 30 30 Z" 
                              fill="#EFEADE" opacity="0.08" transform="rotate(45 60 60)" />
                        <path d="M15 15 C25 10 30 15 25 25 C30 20 35 25 25 35 C35 30 40 35 30 45 C20 40 15 35 20 25 C15 30 10 25 15 15 Z" 
                              fill="#D5C9B1" opacity="0.15" />
                        <path d="M105 15 C115 10 120 15 115 25 C120 20 125 25 115 35 C125 30 130 35 120 45 C110 40 105 35 110 25 C105 30 100 25 105 15 Z" 
                              fill="#D5C9B1" opacity="0.15" />
                        <path d="M15 105 C25 100 30 105 25 115 C30 110 35 115 25 125 C35 120 40 125 30 135 C20 130 15 125 20 115 C15 120 10 115 15 105 Z" 
                              fill="#D5C9B1" opacity="0.15" />
                        <path d="M105 105 C115 100 120 105 115 115 C120 110 125 115 115 125 C125 120 130 125 120 135 C110 130 105 125 110 115 C105 120 100 115 105 105 Z" 
                              fill="#D5C9B1" opacity="0.15" />
                        <rect x="5" y="5" width="110" height="110" fill="none" stroke="#295211" strokeWidth="0.5" opacity="0.1" />
                        <rect x="10" y="10" width="100" height="100" fill="none" stroke="#CCD145" strokeWidth="0.5" opacity="0.1" />
                        <circle cx="60" cy="60" r="3" fill="#FFB0BC" opacity="0.2" />
                        <circle cx="0" cy="0" r="3" fill="#CCD145" opacity="0.15" />
                        <circle cx="120" cy="120" r="3" fill="#CCD145" opacity="0.15" />
                        <circle cx="0" cy="120" r="3" fill="#CCD145" opacity="0.15" />
                        <circle cx="120" cy="0" r="3" fill="#CCD145" opacity="0.15" />
                        <path d="M50 50 L70 50 L70 70 L50 70 Z" fill="#A62630" opacity="0.08" />
                        <path d="M40 40 L80 40 L80 80 L40 80 Z" fill="none" stroke="#EFEADE" strokeWidth="0.5" opacity="0.08" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#carpet-dup-${i})`} />
                  </svg>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Floating geometric elements */}
        <motion.div
          className="absolute top-10 left-10 opacity-20 z-5"
          animate={{ y: [0, -15, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <svg width="70" height="70" viewBox="0 0 100 100">
            <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="#CCD145" opacity="0.3" />
            <path d="M50 15 L85 50 L50 85 L15 50 Z" fill="none" stroke="#FFB0BC" strokeWidth="2" opacity="0.2" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-10 right-10 opacity-20 z-5"
          animate={{ y: [0, 15, 0], rotate: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <svg width="60" height="60" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#FFB0BC" strokeWidth="3" opacity="0.3" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="#A62630" strokeWidth="2" opacity="0.2" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute top-1/3 left-1/4 opacity-15 z-5"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <svg width="45" height="45" viewBox="0 0 100 100">
            <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="#EFEADE" opacity="0.2" />
          </svg>
        </motion.div>
      </div>

      {/* ============================================
          BOTTOM SECTION - Content
          ============================================ */}
      <div className="relative flex-1 bg-rosewood dark:bg-grove">
        {/* Subtle pattern overlay blending from top */}
        <div className="absolute inset-0 bg-gradient-to-t from-rosewood via-rosewood/95 to-transparent dark:from-grove dark:via-grove/95" />
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bottom-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="#CCD145" opacity="0.2" />
                <circle cx="30" cy="30" r="2" fill="#D5C9B1" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bottom-pattern)" />
          </svg>
        </div>

        {/* Content Container */}
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            
            {/* LEFT SIDE - Title with Fade Transition */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col justify-center"
            >
              <div className="relative h-[120px] md:h-[160px] lg:h-[200px] flex items-center">
                <AnimatePresence mode="wait">
                  {!showArabic ? (
                    <motion.h1
                      key="english"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.6 }}
                      className="font-period-narrow font-bold text-5xl md:text-7xl lg:text-8xl text-plaster dark:text-plaster leading-none tracking-tight absolute"
                    >
                      BAZAAR 47
                    </motion.h1>
                  ) : (
                    <motion.h1
                      key="arabic"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.6 }}
                      className="font-period-narrow font-bold text-5xl md:text-7xl lg:text-8xl text-plaster dark:text-plaster leading-none tracking-tight absolute"
                      style={{ fontFamily: 'inherit' }}
                      dir="rtl"
                    >
                      بازار ٤٧
                    </motion.h1>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <Button 
                  variant="primary" 
                  size="lg"
                  className="group bg-cypress hover:bg-cypress/90 text-plaster dark:bg-chartreuse dark:hover:bg-chartreuse/90 dark:text-grove px-8 py-4 text-base md:text-lg rounded-none border-0"
                >
                  Explore Collection
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-plaster/10 hover:bg-plaster/20 text-plaster border border-plaster/40 hover:border-plaster/60 backdrop-blur-sm dark:bg-grove/20 dark:hover:bg-grove/30 px-8 py-4 text-base md:text-lg rounded-none"
                >
                  View Events
                </Button>
              </div>
            </motion.div>

            {/* RIGHT SIDE - Quote (Smaller) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col justify-center items-end text-right"
            >
              <blockquote className="max-w-sm">
                <p className="font-period italic text-lg md:text-xl lg:text-2xl text-plaster/80 dark:text-plaster/80 leading-relaxed">
                  The warmth of gathering<br />is the color of home.
                </p>
                <footer className="mt-2">
                  <cite className="font-period text-sm md:text-base text-chartreuse dark:text-chartreuse not-italic">
                    — Mahmoud Darwish
                  </cite>
                </footer>
              </blockquote>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-plaster/30 dark:text-plaster/30 z-20"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </div>
    </section>
  )
}