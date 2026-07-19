'use client'

import { motion } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import Image from 'next/image'

// Import your images
import overlay from "@/assets/newAssets/overlay.png"
import bazaar47Head from "@/assets/newAssets/bazaar47Head.png"
import Mandrin from "@/assets/newAssets/Mandrin.png"
import Olive from "@/assets/newAssets/Olive.png"
import Vector from "@/assets/newAssets/Vector.svg"
import FLMap from "@/assets/newAssets/FLMap.png"

export function Hero() {
  const nextSectionRef = useRef<HTMLDivElement>(null)

  const scrollToNextSection = () => {
    if (nextSectionRef.current) {
      nextSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-[#FFB0BC]">
      
      {/* ============================================
          LAYER 1: Vector Frame Background
          ============================================ */}
      <div className="absolute inset-26">
        <Image
          src={Vector}
          alt=""
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* ============================================
          LAYER 2: Overlay PNG
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

      {/* ============================================
    ELEMENT: FLMap - Top Right
    ============================================ */}
      <div className="absolute z-10" style={{ top: '20px', right: '80px' }}>
        <Image
          src={FLMap}
          alt="Florida Map"
          width={180}      // ← Adjust width as needed
          height={80}      // ← Adjust height as needed
          className="object-contain"
          priority
        />
      </div>

      {/* ============================================
          ELEMENT: Mandrin - Top Left
          ============================================ */}
      <div className="absolute z-10" style={{ top: '-300px'}}>
        <Image
          src={Mandrin}
          alt=""
          width={600}
          height={200}
          className="object-contain"
          priority
        />
      </div>

      {/* ============================================
          ELEMENT: Olive - Bottom Right
          ============================================ */}
      <div className="absolute z-10" style={{ bottom: '-2px', right: '0px' }}>
        <Image
          src={Olive}
          alt=""
          width={350}
          height={100}
          className="object-contain"
          priority
        />
      </div>

      {/* ============================================
          MAIN LOGO: bazaar47Head - Centered
          ============================================ */}
      <div className="absolute z-10" style={{ 
        top: '52%', 
        left: '50%', 
        transform: 'translate(-50%, -55%)',
        width: '800px',
        height: 'auto',
      }}>
        <Image
          src={bazaar47Head}
          alt="Bazaar 47"
          width={400}
          height={200}
          className="object-contain w-full h-auto"
          priority
        />
      </div>

      {/* ============================================
          TOP TEXT - EST. 2026 / GAINESVILLE, FLORIDA
          ============================================ */}
      <div className="absolute z-20 text-center" style={{ top: '24px', left: 0, right: 0 }}>
        <p className="font-host-grotesk font-semibold text-[24px] leading-[108%] text-[#6A2630] uppercase tracking-normal">
          EST. 2026
        </p>
        <p className="font-host-grotesk font-semibold text-[24px] leading-[108%] text-[#6A2630] uppercase tracking-normal" style={{ marginTop: '2px' }}>
          GAINESVILLE, FLORIDA
        </p>
      </div>

      {/* ============================================
          BOTTOM BUTTON - About Bazaar Florida Tour →
          ============================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute z-20 left-1/2 -translate-x-1/2"
        style={{ bottom: '20px' }}
      >
        <Button
          onClick={scrollToNextSection}
          className="bg-[#6A2630] hover:bg-henna/80 text-plaster transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl font-host-grotesk font-semibold"
          style={{
            width: '360px',
            height: '50px',
            borderRadius: '20px',
            fontSize: '18px',
            lineHeight: '100%',
            letterSpacing: '2%',
          }}
        >
          <span>About Bazaar Florida Tour</span>
          <ArrowRight className="w-4 h-4 font-bold group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </motion.div>

      {/* Hidden div for next section reference */}
      <div ref={nextSectionRef} className="absolute bottom-0" />
    </section>
  )
}