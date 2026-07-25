'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Calendar, MapPin, Users, Paintbrush, ExternalLink } from 'lucide-react'
import { SectionContainer } from '@/app/components/ui/section-container'
import frame1 from '@/assets/newAssets/frame1.svg'

export function ExhibitionSection() {
  return (
    <SectionContainer background="accent" spacing="lg" className="relative overflow-hidden">
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="exhibition-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="#341B1C" />
              <circle cx="30" cy="30" r="2" fill="#CCD145" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#exhibition-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-[#6A2630]/60" />
            <span className="font-host-grotesk text-xs text-[#6A2630] uppercase tracking-[0.3em] font-bold">
              FLORIDA TOUR
            </span>
            <span className="w-8 h-px bg-[#6A2630]/60" />
          </div>
          <h2 className="font-host-grotesk-narrow font-bold text-3xl md:text-4xl lg:text-5xl text-rosewood">
            Orlando Artist Showcase
          </h2>
          <p className="font-host-grotesk text-base md:text-lg text-rosewood/60 mt-2">
            Submit your art for the exhibition at Casselberry Arts Center
          </p>
        </motion.div>

        {/* Main Content - Simple grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column - Event Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="bg-white/50 rounded-2xl p-6 border border-rosewood/5">
              <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#6A2630]" />
                Event Details
              </h3>
              <div className="space-y-3 text-sm text-rosewood/70 font-host-grotesk">
                <p><span className="font-semibold text-rosewood">Date:</span> Saturday, August 8, 2026</p>
                <p><span className="font-semibold text-rosewood">Time:</span> 6:00 PM — 10:00 PM</p>
                <p><span className="font-semibold text-rosewood">Location:</span> Casselberry Arts Center</p>
                <p className="text-rosewood/50 text-xs">137 Quail Pond Circle, Casselberry, FL 32707</p>
              </div>
            </div>

            {/* Curators */}
            <div className="bg-white/50 rounded-2xl p-6 border border-rosewood/5">
              <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#6A2630]" />
                Curatorial Team
              </h3>
              <div className="space-y-2 text-sm font-host-grotesk">
                <p><span className="font-semibold text-rosewood">Damian Jimenez-Lazarte</span> <span className="text-rosewood/40">@damenezi</span></p>
                <p><span className="font-semibold text-rosewood">Teagan Carregal</span> <span className="text-rosewood/40">@teagancarregalstudio</span></p>
                <p><span className="font-semibold text-rosewood">Alexis Collum</span> <span className="text-rosewood/40">@alexiskaylacreations</span></p>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Theme & CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {/* Theme */}
            <div className="bg-chartreuse/5 rounded-2xl p-6 border border-chartreuse/10">
              <h3 className="font-host-grotesk font-bold text-lg text-rosewood mb-3 flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-[#6A2630]" />
                Theme
              </h3>
              <p className="font-host-grotesk text-sm text-rosewood/70 leading-relaxed italic">
                &ldquo;Florida as a place, experience, memory, contradiction, and point of view.&rdquo;
              </p>
              <p className="font-host-grotesk text-md font-semibold text-[#6A2630] mt-3">
                Open to all visual mediums. Up to 2 submissions per artist. Free to apply.
              </p>
            </div>

            {/* Deadline & Apply */}
            <div className="bg-rosewood/5 rounded-2xl p-6 border border-rosewood/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                Deadline
                </h3>
                <span className="font-host-grotesk font-bold text-poppy text-sm bg-poppy/10 px-3 py-1 rounded-full">
                July 31
                </span>
            </div>
            
            <Link
                href="https://forms.gle/fAVdsCWa6c73HnF47"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#FFB0BC] hover:bg-[#CCD145] text-grove hover:text-grove font-host-grotesk font-bold text-base py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02]"
            >
                Submit Your Art
                <ExternalLink className="w-4 h-4" />
            </Link>
            
            <p className="text-center font-host-grotesk text-sm text-[#6A2630]/40 mt-3">
                Questions? <span className="text-rosewood/60">info@bazaar47.com</span>
            </p>
            </div>
          </motion.div>
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center font-host-grotesk font-bold text-lg text-[#6A2630] mt-8"
        >
          ✦ Part of Bazaar47s Florida Tour • Orlando Stop ✦
        </motion.p>
      </div>
    </SectionContainer>
  )
}