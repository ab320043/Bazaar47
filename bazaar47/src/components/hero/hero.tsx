'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reem_Kufi } from 'next/font/google'

// A geometric display font that reads well for Arabic headlines
const arabicDisplay = Reem_Kufi({ subsets: ['arabic'], weight: '700' })

export function Hero() {
  const [showArabic, setShowArabic] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowArabic((prev) => !prev)
    }, 5000) // Switch every 6 seconds
    return () => clearInterval(interval)
  }, [])

  // Animation variants for English letters (left to right)
  const englishContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  }

  const letterVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  }

  // Animation variants for Arabic (right to left, fade in)
  const arabicContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  }

  const arabicLetterVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  const englishText = "BAZAAR 47"
  const arabicText = "بازار ٧٤"

  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-rosewood dark:bg-grove">
      
      {/* ============================================
          FULL SCREEN ANIMATED PATTERN - Rosewood & Grove colors
          ============================================ */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rosewood/60 via-rosewood/40 to-grove/70 dark:from-grove/70 dark:via-grove/50 dark:to-rosewood/70 z-10" />
        
        <div className="absolute inset-0 flex items-center">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 120, // Slower - 3 seconds slower than before
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <div className="flex h-full">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[350px] h-full">
                  <svg className="w-full h-full" viewBox="0 0 350 450" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <pattern id={`carpet-${i}`} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                        <rect width="120" height="120" fill="none" />
                        <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="#CCD145" opacity="0.12" />
                        <path d="M60 15 L105 60 L60 105 L15 60 Z" fill="#FFB0BC" opacity="0.08" />
                        <path d="M30 30 C45 20 55 25 60 40 C65 25 75 20 90 30 C80 45 85 55 70 60 C85 65 80 75 90 90 C75 80 65 85 60 70 C55 85 45 80 30 90 C40 75 35 65 50 60 C35 55 40 45 30 30 Z"
                              fill="#295211" opacity="0.15" />
                        <path d="M30 30 C45 20 55 25 60 40 C65 25 75 20 90 30 C80 45 85 55 70 60 C85 65 80 75 90 90 C75 80 65 85 60 70 C55 85 45 80 30 90 C40 75 35 65 50 60 C35 55 40 45 30 30 Z"
                              fill="#A62630" opacity="0.1" transform="rotate(45 60 60)" />
                        <path d="M15 15 C25 10 30 15 25 25 C30 20 35 25 25 35 C35 30 40 35 30 45 C20 40 15 35 20 25 C15 30 10 25 15 15 Z"
                              fill="#202912" opacity="0.15" />
                        <path d="M105 15 C115 10 120 15 115 25 C120 20 125 25 115 35 C125 30 130 35 120 45 C110 40 105 35 110 25 C105 30 100 25 105 15 Z"
                              fill="#202912" opacity="0.15" />
                        <path d="M15 105 C25 100 30 105 25 115 C30 110 35 115 25 125 C35 120 40 125 30 135 C20 130 15 125 20 115 C15 120 10 115 15 105 Z"
                              fill="#341B1C" opacity="0.15" />
                        <path d="M105 105 C115 100 120 105 115 115 C120 110 125 115 115 125 C125 120 130 125 120 135 C110 130 105 125 110 115 C105 120 100 115 105 105 Z"
                              fill="#341B1C" opacity="0.15" />
                        <rect x="5" y="5" width="110" height="110" fill="none" stroke="#295211" strokeWidth="0.5" opacity="0.08" />
                        <rect x="10" y="10" width="100" height="100" fill="none" stroke="#CCD145" strokeWidth="0.5" opacity="0.08" />
                        <circle cx="60" cy="60" r="3" fill="#FFB0BC" opacity="0.15" />
                        <circle cx="0" cy="0" r="3" fill="#CCD145" opacity="0.1" />
                        <circle cx="120" cy="120" r="3" fill="#CCD145" opacity="0.1" />
                        <circle cx="0" cy="120" r="3" fill="#CCD145" opacity="0.1" />
                        <circle cx="120" cy="0" r="3" fill="#CCD145" opacity="0.1" />
                        <path d="M50 50 L70 50 L70 70 L50 70 Z" fill="#A62630" opacity="0.06" />
                        <path d="M40 40 L80 40 L80 80 L40 80 Z" fill="none" stroke="#EFEADE" strokeWidth="0.5" opacity="0.06" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#carpet-${i})`} />
                  </svg>
                </div>
              ))}
            </div>
            <div className="flex h-full">
              {[...Array(10)].map((_, i) => (
                <div key={`dup-${i}`} className="flex-shrink-0 w-[350px] h-full">
                  <svg className="w-full h-full" viewBox="0 0 350 450" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <pattern id={`carpet-dup-${i}`} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                        <rect width="120" height="120" fill="none" />
                        <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="#CCD145" opacity="0.12" />
                        <path d="M60 15 L105 60 L60 105 L15 60 Z" fill="#FFB0BC" opacity="0.08" />
                        <path d="M30 30 C45 20 55 25 60 40 C65 25 75 20 90 30 C80 45 85 55 70 60 C85 65 80 75 90 90 C75 80 65 85 60 70 C55 85 45 80 30 90 C40 75 35 65 50 60 C35 55 40 45 30 30 Z"
                              fill="#295211" opacity="0.15" />
                        <path d="M30 30 C45 20 55 25 60 40 C65 25 75 20 90 30 C80 45 85 55 70 60 C85 65 80 75 90 90 C75 80 65 85 60 70 C55 85 45 80 30 90 C40 75 35 65 50 60 C35 55 40 45 30 30 Z"
                              fill="#A62630" opacity="0.1" transform="rotate(45 60 60)" />
                        <path d="M15 15 C25 10 30 15 25 25 C30 20 35 25 25 35 C35 30 40 35 30 45 C20 40 15 35 20 25 C15 30 10 25 15 15 Z"
                              fill="#202912" opacity="0.15" />
                        <path d="M105 15 C115 10 120 15 115 25 C120 20 125 25 115 35 C125 30 130 35 120 45 C110 40 105 35 110 25 C105 30 100 25 105 15 Z"
                              fill="#202912" opacity="0.15" />
                        <path d="M15 105 C25 100 30 105 25 115 C30 110 35 115 25 125 C35 120 40 125 30 135 C20 130 15 125 20 115 C15 120 10 115 15 105 Z"
                              fill="#341B1C" opacity="0.15" />
                        <path d="M105 105 C115 100 120 105 115 115 C120 110 125 115 115 125 C125 120 130 125 120 135 C110 130 105 125 110 115 C105 120 100 115 105 105 Z"
                              fill="#341B1C" opacity="0.15" />
                        <rect x="5" y="5" width="110" height="110" fill="none" stroke="#295211" strokeWidth="0.5" opacity="0.08" />
                        <rect x="10" y="10" width="100" height="100" fill="none" stroke="#CCD145" strokeWidth="0.5" opacity="0.08" />
                        <circle cx="60" cy="60" r="3" fill="#FFB0BC" opacity="0.15" />
                        <circle cx="0" cy="0" r="3" fill="#CCD145" opacity="0.1" />
                        <circle cx="120" cy="120" r="3" fill="#CCD145" opacity="0.1" />
                        <circle cx="0" cy="120" r="3" fill="#CCD145" opacity="0.1" />
                        <circle cx="120" cy="0" r="3" fill="#CCD145" opacity="0.1" />
                        <path d="M50 50 L70 50 L70 70 L50 70 Z" fill="#A62630" opacity="0.06" />
                        <path d="M40 40 L80 40 L80 80 L40 80 Z" fill="none" stroke="#EFEADE" strokeWidth="0.5" opacity="0.06" />
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
          className="absolute top-12 left-12 opacity-25 z-5"
          animate={{ y: [0, -15, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <svg width="70" height="70" viewBox="0 0 100 100">
            <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="#CCD145" opacity="0.25" />
            <path d="M50 15 L85 50 L50 85 L15 50 Z" fill="none" stroke="#FFB0BC" strokeWidth="2" opacity="0.15" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-12 right-12 opacity-20 z-5"
          animate={{ y: [0, 15, 0], rotate: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <svg width="60" height="60" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#FFB0BC" strokeWidth="3" opacity="0.25" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="#A62630" strokeWidth="2" opacity="0.15" />
          </svg>
        </motion.div>
      </div>

      {/* ============================================
          CONTENT - Centered but moved UP
          ============================================ */}
      <div className="relative z-20 container mx-auto px-4 h-full flex flex-col items-center justify-center -mt-16 md:-mt-20 lg:-mt-24">
        
        {/* Title with EN/AR transition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col items-center"
        >
          <div className="relative flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!showArabic ? (
                <motion.div
                  key="english"
                  variants={englishContainer}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex"
                >
                  {englishText.split('').map((char, index) => (
                    <motion.span
                      key={index}
                      variants={letterVariants}
                      className="font-period-narrow font-bold text-plaster dark:text-plaster leading-none tracking-tight"
                      style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </motion.span>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="arabic"
                  variants={arabicContainer}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`${arabicDisplay.className} flex`}
                  dir="rtl"
                >
                  {arabicText.split('').map((char, index) => (
                    <motion.span
                      key={index}
                      variants={arabicLetterVariants}
                      className="text-plaster dark:text-plaster leading-none tracking-tight"
                      style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-6 md:mt-8">
            <Button
              variant="primary"
              size="lg"
              className="group bg-cypress hover:bg-cypress/90 text-plaster dark:bg-chartreuse dark:hover:bg-chartreuse/90 dark:text-grove px-6 py-3 md:px-8 md:py-4 text-sm md:text-base rounded-none border-0"
            >
              Explore Collection
              <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="bg-plaster/10 hover:bg-plaster/20 text-plaster border border-plaster/40 hover:border-plaster/60 backdrop-blur-sm dark:bg-grove/20 dark:hover:bg-grove/30 px-6 py-3 md:px-8 md:py-4 text-sm md:text-base rounded-none"
            >
              View Events
            </Button>
          </div>
        </motion.div>

        {/* Quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-xs md:max-w-sm mt-6 md:mt-8"
        >
          <p className="font-period italic text-xs md:text-sm text-plaster/70 dark:text-plaster/70 leading-relaxed text-center">
            The warmth of gathering is the color of home.
          </p>
          <footer className="mt-1 text-center">
            <cite className="font-period text-[11px] md:text-xs text-chartreuse dark:text-chartreuse not-italic">
              — Mahmoud Darwish
            </cite>
          </footer>
        </motion.blockquote>
      </div>
    </section>
  )
}