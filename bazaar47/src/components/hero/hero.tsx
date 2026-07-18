'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reem_Kufi } from 'next/font/google'

// Import your images
import HeroBGFour from '@/assets/HeroBGFour.jpg'
import HeroBGOne from '@/assets/HeroBGThree.jpg'

// A geometric display font that reads well for Arabic headlines
const arabicDisplay = Reem_Kufi({ subsets: ['arabic'], weight: '700' })

export function Hero() {
  const [showArabic, setShowArabic] = useState(false)
  const nextSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowArabic((prev) => !prev)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const scrollToNextSection = () => {
    if (nextSectionRef.current) {
      nextSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

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
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { duration: 0.3 }
    },
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
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: { duration: 0.3 }
    },
  }

  const englishText = "Bazaar47"
  const arabicText = "بازار٧٤"

  return (
    <section className="relative h-screen min-h-175 w-full overflow-hidden bg-plaster">
      
      {/* ============================================
          BACKGROUND IMAGE - Rounded top corners
          ============================================ */}
      <div className="absolute inset-0 rounded-t-[40px] md:rounded-t-[60px] overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${HeroBGFour.src})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '500px 500px',
            backgroundPosition: 'center',
            opacity: 0.9,
          }}
        />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-rosewood/5 via-rosewood/10 to-rosewood/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-plaster/10 to-transparent" />
      </div>

      {/* ============================================
          FLOATING GEOMETRIC ELEMENTS
          ============================================ */}
      {/* <motion.div
        className="absolute top-12 left-12 opacity-20 z-5"
        animate={{ y: [0, -15, 0], rotate: [0, 45, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <svg width="70" height="70" viewBox="0 0 100 100">
          <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="#CCD145" opacity="0.3" />
          <path d="M50 15 L85 50 L50 85 L15 50 Z" fill="none" stroke="#FFB0BC" strokeWidth="2" opacity="0.2" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-12 right-12 opacity-20 z-5"
        animate={{ y: [0, 15, 0], rotate: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <svg width="60" height="60" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#FFB0BC" strokeWidth="3" opacity="0.3" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="#A62630" strokeWidth="2" opacity="0.2" />
        </svg>
      </motion.div> */}

      {/* ============================================
          CONTENT - Centered
          ============================================ */}
      <div className="relative z-20 container mx-auto px-6 md:px-10 h-full flex flex-col items-center justify-center">
        
        {/* Title with EN/AR transition - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col items-center max-w-4xl"
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
                  className="flex flex-wrap justify-center"
                >
                  {englishText.split('').map((char, index) => (
                    <motion.span
                      key={index}
                      variants={letterVariants}
                      className="font-period-narrow font-black text-rosewood leading-none tracking-tight -mt-12 md:-mt-16 lg:-mt-28"
                      style={{ 
                        fontSize: 'clamp(3rem, 9vw, 8rem)',
                        textShadow: `
                          0 2px 4px rgba(239, 234, 222, 0.3),
                          0 4px 8px rgba(239, 234, 222, 0.15)
                        `
                      }}
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
                  className={`${arabicDisplay.className} flex flex-wrap justify-center`}
                  dir="rtl"
                >
                  {arabicText.split('').map((char, index) => (
                    <motion.span
                      key={index}
                      variants={arabicLetterVariants}
                      className="text-rosewood leading-none tracking-tight -mt-12 md:-mt-16 lg:-mt-28"
                      style={{ 
                        fontSize: 'clamp(3rem, 9vw, 8rem)',
                        textShadow: `
                          0 2px 4px rgba(239, 234, 222, 0.3),
                          0 4px 8px rgba(239, 234, 222, 0.15)
                        `
                      }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Decorative divider
          <div className="flex items-center gap-4 mt-4 mb-4">
            <div className="w-16 h-px bg-chartreuse/50" />
            <span className="font-period text-xs text-rosewood/40 tracking-[0.3em]">✦</span>
            <div className="w-16 h-px bg-chartreuse/50" />
          </div> */}
        </motion.div>
      </div>

      {/* ============================================
    QUOTE - Bottom Left, Same BG as Button
    ============================================ */}
    {/* <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="absolute bottom-24 left-6 md:left-10 z-20 max-w-sm"
    >
      <div className="bg-rosewood/90 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-lg border border-rosewood/20">
        <p className="font-period-narrow font-black text-plaster tracking-tight leading-relaxed text-sm md:text-base">
          &ldquo;The warmth of gathering is the color of home.&rdquo;
        </p>
        <footer className="mt-1 flex items-center gap-2">
          <span className="w-6 h-px bg-chartreuse/60" />
          <cite className="font-period text-[11px] md:text-xs text-chartreuse not-italic font-bold">
            Mahmoud Darwish
          </cite>
        </footer>
      </div>
    </motion.div> */}

      {/* ============================================
          BUTTON - Bottom Right, Fully Rounded
          ============================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute bottom-24 right-6 md:right-10 z-20"
      >
        <Button
          onClick={scrollToNextSection}
          variant="primary"
          size="lg"
          className="group bg-rosewood hover:bg-rosewood/80 text-plaster px-8 py-4 md:px-10 md:py-5 text-sm md:text-base rounded-full border-0 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl"
        >
          <span className="font-period font-bold tracking-widest uppercase">Explore More</span>
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform duration-300" />
        </Button>
      </motion.div>

      {/* ============================================
          SCROLL INDICATOR - Right side
          ============================================ */}
      <motion.div
        className="absolute bottom-8 right-8 z-10 hidden md:flex flex-col items-center gap-2 text-rosewood/30"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="font-period text-[10px] tracking-[0.3em] uppercase [writing-mode:vertical-rl]">
          Scroll
        </span>
        <div className="w-px h-12 bg-rosewood/20" />
      </motion.div>

      {/* Hidden div for next section reference */}
      <div ref={nextSectionRef} className="absolute bottom-0" />
    </section>
  )
}