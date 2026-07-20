'use client'

import { motion } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import Image from 'next/image'

// Import your images
import overlay from "@/assets/newAssets/overlay.png"
import Mandrin from "@/assets/newAssets/Mandrin.png"
import Olive from "@/assets/newAssets/Olive.png"
import FLMap from "@/assets/newAssets/FLMap.png"
import heroCenterLogoDesktop from "@/assets/newAssets/heroCenterLogoDesktop.png"
import MobileBgSplash from "@/assets/newAssets/MobileBgSplash.png"

export function Hero() {
  const nextSectionRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth
      setWindowWidth(width)
      setIsMobile(width < 768)
    }
    
    checkSize()
    window.addEventListener('resize', checkSize)
    
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  const scrollToNextSection = () => {
    if (nextSectionRef.current) {
      nextSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Calculate responsive sizes based on viewport
  const getResponsiveSize = (baseSize: number, minSize: number, maxSize: number) => {
    if (windowWidth < 480) return minSize
    if (windowWidth > 1920) return maxSize
    return Math.min(maxSize, Math.max(minSize, baseSize * (windowWidth / 1440)))
  }

  // Responsive values
  const logoWidth = Math.min(700, Math.max(280, windowWidth * 0.45))
  const oliveWidth = Math.min(350, Math.max(120, windowWidth * 0.2))
  const mandrinWidth = Math.min(600, Math.max(200, windowWidth * 0.35))
  const flMapWidth = Math.min(180, Math.max(80, windowWidth * 0.1))
  const buttonWidth = Math.min(360, Math.max(280, Math.min(360, windowWidth * 0.75)))
  const titleSize = Math.min(24, Math.max(14, windowWidth * 0.018))

  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-[#FFB0BC]">
      
      {/* ============================================
          MOBILE VIEW: MobileBgSplash
          ============================================ */}
      {isMobile && (
        <div className="absolute inset-0 z-0">
          <Image
            src={MobileBgSplash}
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* ============================================
          DESKTOP VIEW: All desktop elements
          ============================================ */}
      {!isMobile && (
        <>
          {/* LAYER 1: Overlay PNG */}
          <div className="absolute inset-0 opacity-30 z-0">
            <Image
              src={overlay}
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* ELEMENT: FLMap - Top Right */}
          <div 
            className="absolute z-10"
            style={{ 
              top: Math.min(50, Math.max(20, windowWidth * 0.035)),
              right: Math.min(80, Math.max(20, windowWidth * 0.05)),
              width: flMapWidth,
            }}
          >
            <Image
              src={FLMap}
              alt="Florida Map"
              width={flMapWidth}
              height={flMapWidth * 0.44}
              className="object-contain w-full h-auto"
              priority
            />
          </div>

          {/* ELEMENT: Mandrin - Top Left (behind logo) */}
          <div 
            className="absolute z-5"
            style={{ 
              top: Math.min(-50, Math.max(-120, -windowWidth * 0.1)),
              left: Math.min(-20, Math.max(-80, -windowWidth * 0.05)),
              width: mandrinWidth,
            }}
          >
            <Image
              src={Mandrin}
              alt=""
              width={mandrinWidth}
              height={mandrinWidth * 0.33}
              className="object-contain w-full h-auto"
              priority
            />
          </div>

          {/* MAIN LOGO: heroCenterLogoDesktop - Centered */}
          <div 
            className="absolute z-10"
            style={{ 
              top: '52%', 
              left: '50%', 
              transform: 'translate(-50%, -60%)',
              width: logoWidth,
            }}
          >
            <Image
              src={heroCenterLogoDesktop}
              alt="Bazaar 47"
              className="object-contain w-full h-auto"
              priority
            />
          </div>

          {/* ELEMENT: Olive - Bottom Right */}
          <div 
            className="absolute z-10"
            style={{ 
              bottom: Math.min(0, Math.max(-20, -windowWidth * 0.01)),
              right: Math.min(0, Math.max(-30, -windowWidth * 0.02)),
              width: oliveWidth,
            }}
          >
            <Image
              src={Olive}
              alt=""
              width={oliveWidth}
              height={oliveWidth * 0.28}
              className="object-contain w-full h-auto"
              priority
            />
          </div>
        </>
      )}

      {/* ============================================
          TOP TEXT - EST. 2026 / GAINESVILLE, FLORIDA
          RESPONSIVE WITH FIXED POSITION
          ============================================ */}
      <div 
        className="absolute z-20 text-center w-full"
        style={{ 
          top: Math.min(24, Math.max(12, windowWidth * 0.018)),
          left: 0, 
          right: 0,
          pointerEvents: 'none',
          paddingLeft: Math.min(20, Math.max(10, windowWidth * 0.02)),
          paddingRight: Math.min(20, Math.max(10, windowWidth * 0.02))
        }}
      >
        <p 
          className="font-host-grotesk font-semibold text-[#6A2630] uppercase tracking-normal inline-block"
          style={{
            fontSize: `${titleSize}px`,
            lineHeight: '108%',
          }}
        >
          EST. 2026
        </p>
        <br />
        <p 
          className="font-host-grotesk font-semibold text-[#6A2630] uppercase tracking-normal inline-block"
          style={{
            fontSize: `${titleSize}px`,
            lineHeight: '108%',
            marginTop: '2px'
          }}
        >
          GAINESVILLE, FLORIDA
        </p>
      </div>

      {/* ============================================
          BOTTOM BUTTON - RESPONSIVE WITH FIXED POSITION
          ============================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute z-20 left-1/2 -translate-x-1/2"
        style={{ 
          bottom: Math.min(20, Math.max(10, windowWidth * 0.015)),
          width: buttonWidth,
          maxWidth: '360px',
          minWidth: '280px',
          pointerEvents: 'none',
          paddingLeft: Math.min(16, Math.max(8, windowWidth * 0.01)),
          paddingRight: Math.min(16, Math.max(8, windowWidth * 0.01))
        }}
      >
        <Button
          onClick={scrollToNextSection}
          className="bg-[#6A2630] hover:bg-henna/80 text-plaster transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl font-host-grotesk font-semibold w-full"
          style={{
            height: Math.min(50, Math.max(40, windowWidth * 0.035)),
            borderRadius: '20px',
            fontSize: Math.min(18, Math.max(14, windowWidth * 0.0125)),
            lineHeight: '100%',
            letterSpacing: '2%',
            pointerEvents: 'auto',
            paddingLeft: Math.min(16, Math.max(10, windowWidth * 0.015)),
            paddingRight: Math.min(16, Math.max(10, windowWidth * 0.015))
          }}
        >
          <span style={{ 
            fontSize: Math.min(18, Math.max(14, windowWidth * 0.0125)),
            whiteSpace: 'nowrap'
          }}>
            About Bazaar Florida Tour
          </span>
          <ArrowRight className="w-4 h-4 font-bold group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
        </Button>
      </motion.div>

      {/* Hidden div for next section reference */}
      <div ref={nextSectionRef} className="absolute bottom-0" />
    </section>
  )
}