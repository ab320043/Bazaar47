'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Play, Volume2, VolumeX } from 'lucide-react'
import { Reem_Kufi } from 'next/font/google'
import { useState, useRef, useEffect } from 'react'
import flyer1 from '@/assets/newAssets/flyer1.png'
import Piece from '@/assets/newAssets/Piece.jpg'

const reemKufi = Reem_Kufi({
  subsets: ['arabic'],
  weight: ['400', '700'],
  display: 'swap',
})

export function About() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const originalDescriptionSentences = [
    "Formerly known as How Bazar, Bazaar47, located at 60 S.W. 2nd St. in downtown Gainesville, is a third place and event venue dedicated to bringing people together through diverse experiences while making it easier for others to create experiences of their own.",
    "Through hosting events like open mics, creator meetups, artisan markets, workshops, live music and performances, Bazaar47 aims to create space for community, creativity, openness, curiosity and belonging."
  ]

  return (
    <section className="w-full overflow-hidden bg-grove relative">

      {/* ============================================
          TITLE SECTION - full-bleed plaster background
          ============================================ */}
      <div
        className="relative w-full"
        style={{
          backgroundColor: '#EFEADE',
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end pt-10 md:pt-14 pb-6 md:pb-8 border-b border-[#341B1C]/15">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="font-host-grotesk font-bold text-[32px] sm:text-[40px] md:text-[48px] lg:text-[58px] leading-[108%] tracking-normal text-[#341B1C] text-center md:text-left"
            >
              About Bazaar47
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className={`${reemKufi.className} font-bold text-[22px] sm:text-[26px] md:text-[32px] lg:text-[38px] leading-[140%] tracking-normal text-[#341B1C] mt-2 md:mt-0 text-center md:text-right`}
              dir="rtl"
            >
              كيْف بَلَشَتْ حِكَايَتنَا
            </motion.div>
          </div>
        </div>

        {/* ============================================
            VIDEO SECTION
            ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative w-full overflow-hidden"
        >
          <video
            ref={videoRef}
            className="block w-full h-auto min-h-[250px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-[500px] object-cover rounded-t-[24px] md:rounded-t-[32px]"
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            onClick={togglePlay}
          >
            <source src="/videos/Storytime.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <button
            onClick={toggleMute}
            className="absolute bottom-4 right-4 z-10 bg-[#341B1C]/60 backdrop-blur-sm text-plaster p-2 rounded-full hover:bg-[#341B1C]/80 transition-all duration-300 border border-plaster/10"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-4 left-4 text-chartreuse/40 font-host-grotesk text-[10px] tracking-widest uppercase bg-[#341B1C]/40 px-3 py-1 rounded-full backdrop-blur-sm"
            >
              {isMuted ? '🔇 Muted' : '🔊 Playing'}
            </motion.div>
          )}
        </motion.div>

        {/* ============================================
            ORIGINAL DESCRIPTION - SHORTER & CLEANER
            ============================================ */}
        <div className="relative w-full overflow-hidden py-6 sm:py-8 md:py-10 lg:py-12 bg-[#96161A]">
          <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="max-w-4xl mx-0 w-full px-2 sm:px-0">
              {originalDescriptionSentences.map((sentence, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.3 }}
                  viewport={{ once: true, margin: '-30px' }}
                  className="font-host-grotesk font-regular text-[14px] sm:text-[15px] md:text-[16px] lg:text-[17px] leading-[130%] sm:leading-[125%] md:leading-[120%] tracking-normal text-[#EFEADE] max-w-3xl mb-3 sm:mb-4 md:mb-5 drop-shadow-lg px-1"
                >
                  {sentence}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          TOUR PROMO SECTION - 50/50 Split
          Left: Flyer (fills container completely, no gaps)
          Right: Description + Buttons (Grove BG)
          ============================================ */}
      <div className="relative w-full">
        {/* Desktop: Split backgrounds */}
        <div className="hidden md:block absolute inset-0 md:right-1/2 bg-plaster" />
        <div className="hidden md:block absolute inset-0 md:left-1/2 bg-grove" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-0">
          
          <div className="flex flex-col md:flex-row gap-0 items-stretch min-h-[400px] md:min-h-[500px]">
            
            {/* LEFT: Flyer (50%) - Fills container completely, flush left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
              className="w-full md:w-1/2 bg-plaster relative overflow-hidden -ml-4 sm:-ml-6 md:-ml-8 lg:-ml-18 md:ml-0 md:pl-0"
            >
              <div className="relative w-full h-full min-h-[350px] md:min-h-[400px]">
                <Image
                  src={Piece}
                  alt="Bazaar À La Carte Florida Tour"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>

            {/* RIGHT: Description + Buttons (50%) - Grove BG */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true }}
              className="w-full md:w-1/2 bg-grove py-8 sm:py-10 md:py-12 px-6 sm:px-8 md:px-10 lg:px-12 flex flex-col justify-center text-center md:text-left"
            >
              {/* Tour Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                viewport={{ once: true }}
                className="flex items-center justify-center md:justify-start gap-3 mb-3 sm:mb-4"
              >
                <span className="w-6 sm:w-8 h-px bg-chartreuse/60" />
                <span className="font-host-grotesk text-[10px] sm:text-xs text-chartreuse/60 uppercase tracking-[0.3em] font-bold">
                  Bazaar À La Carte
                </span>
                <span className="w-6 sm:w-8 h-px bg-chartreuse/60" />
              </motion.div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="font-host-grotesk font-bold text-[24px] sm:text-[28px] md:text-[38px] lg:text-[44px] leading-[108%] tracking-normal text-[#EFEADE] mb-2 sm:mb-3"
              >
                Florida Tour 2026
              </motion.h3>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-2 sm:space-y-3 max-w-xl mx-auto md:mx-0"
              >
                <p className="font-host-grotesk font-regular text-[14px] sm:text-[15px] md:text-[17px] leading-[120%] tracking-normal text-[#D5C9B1]">
                  <span className="font-bold text-chartreuse">Bazaar À La Carte</span>
                </p>
                <p className="font-host-grotesk font-regular text-[14px] sm:text-[15px] md:text-[17px] leading-[120%] tracking-normal text-[#D5C9B1]">
                  Join us for a celebration of culture, connection, and the warmth of gathering. This is the beginning of a new chapter, and we want you to be part of it.
                </p>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-12 mt-5 sm:mt-6 md:mt-8"
              >
                <button
                  onClick={() => {
                    const tourSection = document.getElementById('tour-section')
                    if (tourSection) tourSection.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="bg-sand-dune hover:bg-sand-dune/80 text-grove font-host-grotesk font-bold text-xs sm:text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5"
                  style={{ borderRadius: '11px' }}
                >
                  See Tour Dates
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>

                <Link href="/vendors">
                  <button
                    className="bg-sand-dune hover:bg-sand-dune/80 text-grove font-host-grotesk font-bold text-xs sm:text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5"
                    style={{ borderRadius: '11px' }}
                  >
                    Vendor Application
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

    </section>
  )
}