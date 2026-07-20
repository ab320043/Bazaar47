'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import flyer1 from '@/assets/newAssets/flyer1.png'
import highwaySign from '@/assets/newAssets/highwaySign.png'

export function About() {
  return (
    <section className="w-full overflow-hidden bg-grove relative">
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row relative md:items-stretch">
          
          {/* ============================================
              MOBILE FLYER - full-bleed
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="md:hidden relative left-1/2 w-screen -translate-x-1/2 order-1"
          >
            <div className="relative w-full" style={{ aspectRatio: '581 / 726.25' }}>
              <Image
                src={flyer1}
                alt="Bazaar À La Carte Flyer"
                fill
                className="object-cover"
                priority
              />
            </div>
          </motion.div>

          {/* ============================================
              DESKTOP LEFT COLUMN - 50% width, flyer fills it
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="hidden md:block md:w-1/2 relative order-1"
          >
            {/* 
              Wrapper scales proportionally with the column width.
              aspect-ratio locks height to width. 
              overflow-visible lets the highway sign escape.
            */}
            <div className="relative w-full overflow-visible" style={{ aspectRatio: '581 / 726.25', right: '70px' }}>
              <Image
                src={flyer1}
                alt="Bazaar À La Carte Flyer"
                fill
                className="object-contain"
                style={{ objectPosition: 'left center' }}
                priority
              />

              {/* Highway sign: positioned as % of the flyer's box so it scales together */}
              <div
                className="absolute z-20"
                style={{
                  left: '102%',      /* sits near the right edge of the flyer = at the split */
                  top: '35%',       /* vertical position relative to flyer height */
                  width: '34%',     /* size relative to flyer width */
                  aspectRatio: '200 / 500',
                  transform: 'translateX(-50%)', /* center the sign on the split line */
                }}
              >
                <Image
                  src={highwaySign}
                  alt="Highway Sign"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </motion.div>

          {/* ============================================
              TEXT CONTENT - right 50%
              ============================================ */}
          <div className="w-full md:w-1/2 py-10 md:py-16 lg:py-20 px-4 md:px-0 md:pl-10 lg:pl-16 order-2 text-center md:text-left">
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="font-host-grotesk font-bold text-[40px] md:text-[58px] leading-[108%] tracking-normal text-chartreuse"
            >
              About
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="mt-6 space-y-4 max-w-2xl mx-auto md:mx-0"
            >
              <p className="font-host-grotesk font-regular text-[16px] leading-[108%] tracking-normal text-[#D5C9B1]">
                Bazaar À La Carte is a night market hosted by Bazaar47, a community and cultural space in Downtown Gainesville, Florida. Our market is specifically curated to give creatives an opportunity to share and sell their valuable work in a nurturing, low-risk/high-reward environment.
              </p>
              <p className="font-host-grotesk font-regular text-[16px] leading-[108%] tracking-normal text-[#D5C9B1]">
                We welcome vendors within all stages of experience to join us, as we know many people are experimenting with creating and selling.
              </p>
              <p className="font-host-grotesk font-regular text-[16px] leading-[108%] tracking-normal text-[#D5C9B1]">
                Our goal is to create a supportive ecosystem of creators and buyers who both value mindful consumption, craftsmanship, and sustainability.
              </p>
              <p className="font-host-grotesk font-regular text-[16px] leading-[108%] tracking-normal text-chartreuse">
                Kind of like an alternative local economy, ya know?
              </p>
              <p className="font-host-grotesk font-regular text-[16px] leading-[108%] tracking-normal text-sand-dune">
                Bazaar À La Carte has grown so much in Gainesville that we expanded our night market throughout Florida with the help of amazing collaborators in each community we will be visiting.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center md:justify-start gap-8 mt-14"
            >
              <button 
                onClick={() => {
                  const tourSection = document.getElementById('tour-section')
                  if (tourSection) tourSection.scrollIntoView({ behavior: 'smooth' })
                }}
                className="bg-sand-dune hover:bg-sand-dune/80 text-grove font-host-grotesk font-bold text-base transition-all duration-300 flex items-center justify-center gap-2"
                style={{ width: '200px', height: '43px', borderRadius: '11px' }}
              >
                See Tour Dates
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <Link href="/vendors">
                <button 
                  className="bg-sand-dune hover:bg-sand-dune/80 text-grove font-host-grotesk font-bold text-base transition-all duration-300 flex items-center justify-center gap-2"
                  style={{ width: '200px', height: '43px', borderRadius: '11px' }}
                >
                  Vendor Application
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}