// app/components/open-mic/open-mic-section.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Mic2, Music2, Sparkles } from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'

// ============================================
// SESSION DATE — computed at render
// ============================================

const FIRST_SESSION = new Date(2026, 9, 21) // Oct 21, 2026 (month is 0-indexed)

/**
 * Returns the label of the next Open Mic session, computed client-side.
 * Clamps to FIRST_SESSION so pre-launch dates don't compute a bogus
 * "next Wednesday."
 */
function getNextSessionLabel(): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Before the first session: show FIRST_SESSION
  if (today.getTime() < FIRST_SESSION.getTime()) {
    return FIRST_SESSION.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  // From FIRST_SESSION onward: use weekday math
  // If today is Wed, we're on session day — next is 7 days out.
  const dow = today.getDay()
  const offset = dow === 3 ? 7 : (3 - dow + 7) % 7

  const wed = new Date(today)
  wed.setDate(today.getDate() + offset)

  return wed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// ============================================
// COMPONENT
// ============================================

export function OpenMicSection() {
  const nextSession = getNextSessionLabel()

  return (
    <section className="relative w-full bg-grove overflow-hidden">
      {/* Overlay texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <Image src={overlay} alt="" fill className="object-cover" />
      </div>

      {/* Decorative blur */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-chartreuse/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-hippie/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-16 md:py-20 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Eyebrow badge */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-8 h-px bg-chartreuse/60" />
            <span className="font-host-grotesk text-[10px] sm:text-xs text-chartreuse/80 uppercase tracking-[0.3em] font-bold flex items-center gap-2">
              <Mic2 className="w-3 h-3" />
              Every Wednesday
              <Mic2 className="w-3 h-3" />
            </span>
            <span className="w-8 h-px bg-chartreuse/60" />
          </div>

          {/* Title */}
          <h2 className="font-host-grotesk-narrow font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-plaster leading-[0.95]">
            Open Mic
          </h2>
          <p className="font-host-grotesk text-lg sm:text-xl md:text-2xl text-chartreuse mt-3 font-semibold">
            ✦ Bring your sound to the circle ✦
          </p>

          <p className="font-host-grotesk text-sm sm:text-base text-plaster/70 mt-5 max-w-2xl mx-auto">
            Every Wednesday night, Bazaar47 opens its doors to artists of every
            kind. Music, poetry, spoken word, art — come share what you&apos;ve got.
          </p>

          {/* Event details strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-plaster/70 text-sm">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Next: {nextSession}
            </span>
            <span className="hidden sm:inline w-px h-4 bg-plaster/20" />
            <span className="flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              All genres welcome
            </span>
            <span className="hidden sm:inline w-px h-4 bg-plaster/20" />
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Free to perform
            </span>
          </div>

          {/* CTA */}
          <div className="mt-8">
            <Link
              href="/open-mic"
              className="inline-flex items-center gap-2 bg-chartreuse hover:bg-plaster text-grove hover:text-rosewood font-host-grotesk font-bold text-base px-8 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg"
            >
              Sign Up to Perform
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}