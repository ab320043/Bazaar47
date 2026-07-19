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
        <div className="flex flex-col md:flex-row min-h-[600px] lg:min-h-[700px] relative">
          
          {/* ============================================
              HIGHWAY SIGN - At the split point
              ============================================ */}
          <div 
            className="absolute z-10 hidden md:block"
            style={{
              top: '50%',
              left: '43%',
              transform: 'translate(-50%, -25%)',
              width: '250px',
              height: 'auto',
            }}
          >
            <Image
              src={highwaySign}
              alt="Highway Sign"
            //   width={600}
            //   height={600}
              className="object-contain"
              priority
            />
          </div>

          {/* ============================================
              LEFT SIDE - Flyer Image (30%)
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="w-full flex items-center justify-center py-8 md:py-0 order-1 md:order-1 md:-ml-40 lg:-ml-54"
          >
            <div 
              className="relative"
              style={{
                width: '100%',
                maxWidth: '680px',
                aspectRatio: '581 / 726.25',
              }}
            >
              <Image
                src={flyer1}
                alt="Bazaar À La Carte Flyer"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* ============================================
              RIGHT SIDE - Text Content (70%)
              ============================================ */}
          <div className="w-full md:w-[70%] py-12 md:py-16 lg:py-20 pl-0 md:pl-8 lg:pl-12 order-2 md:order-2">
            
            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="font-host-grotesk font-bold text-[58px] leading-[108%] tracking-normal text-chartreuse"
            >
              About
            </motion.h2>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="mt-6 space-y-4 max-w-2xl"
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

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-wrap gap-8 mt-14"
            >
              {/* See Tour Dates - Scrolls to next section */}
              <button 
                onClick={() => {
                  const tourSection = document.getElementById('tour-section')
                  if (tourSection) {
                    tourSection.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className="bg-sand-dune hover:bg-sand-dune/80 text-grove font-host-grotesk font-bold text-base transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  width: '200px',
                  height: '43px',
                  borderRadius: '11px',
                }}
              >
                See Tour Dates
                <ArrowRight className="w-4 h-4" />
              </button>
              
              {/* Vendor Application - Navigates to /vendors page */}
              <Link href="/vendors">
                <button 
                  className="bg-sand-dune hover:bg-sand-dune/80 text-grove font-host-grotesk font-bold text-base transition-all duration-300 flex items-center justify-center gap-2"
                  style={{
                    width: '200px',
                    height: '43px',
                    borderRadius: '11px',
                  }}
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