// app/winter-market/page.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Music,
  ShoppingBag,
  Heart,
  Sparkles,
  Snowflake,
  Star,
  Users,
  Palette,
} from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'
import market1 from '@/assets/market/market1.jpg'
import market2 from '@/assets/market/market2.jpg'
import market3 from '@/assets/market/market3.jpg'
import market4 from '@/assets/market/market4.jpg'
import market5 from '@/assets/market/market5.jpg'
import market6 from '@/assets/market/market6.jpg'
import {
  MARKET_COPY,
  MARKET_HOURS,
  VENUE_NAME,
  VENUE_ADDRESS,
} from '@/data/winter-market'

// ============================================
// GALLERY DATA
// ============================================

const galleryImages = [
  { src: market1, alt: 'String lights over the vendor booths',  span: 'col-span-2 row-span-2' },
  { src: market6, alt: 'Handmade goods on display',             span: '' },
  { src: market3, alt: 'Vintage clothing racks',                span: '' },
  { src: market4, alt: 'Live music on the market stage',        span: '' },
  { src: market5, alt: 'Cozy corner with holiday decor',        span: '' },
  { src: market2, alt: 'Crowd at the night market',             span: 'col-span-2' },
]

// ============================================
// "WHAT TO EXPECT" CARDS — RICH COLOR VERSION
// ============================================

const expectations = [
  {
    icon: ShoppingBag,
    title: '26 Vendor Booths',
    desc: 'Rotating local merchants, vintage clothing, and handmade crafts under the lights.',
    bg: 'bg-chartreuse',
    text: 'text-grove',
    iconBg: 'bg-grove/15 text-grove',
  },
  {
    icon: Music,
    title: 'Live Music & DJs',
    desc: 'Rotating local artists and weekly musical vibes every Friday & Saturday.',
    bg: 'bg-hippie',
    text: 'text-rosewood',
    iconBg: 'bg-rosewood/15 text-rosewood',
  },
  {
    icon: Palette,
    title: 'Wellness & Workshops',
    desc: 'Free skill-shares and community workshops hosted by How Bazar.',
    bg: 'bg-petal',
    text: 'text-henna',
    iconBg: 'bg-henna/15 text-henna',
  },
]

// ============================================
// PAGE
// ============================================

export default function WinterMarketExplorePage() {
  return (
    <div className="relative min-h-screen bg-plaster">
      {/* Texture layer */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <Image src={overlay} alt="" fill className="object-cover" priority />
      </div>

      <div className="relative z-10">

        {/* ============================================
            HERO — full-bleed with market1 as background
            ============================================ */}
        <section className="relative w-full overflow-hidden">
          {/* Background image with dark wash */}
          <div className="absolute inset-0">
            <Image
              src={market1}
              alt=""
              fill
              className="object-cover"
              priority
              quality={95}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-rosewood/85 via-rosewood/75 to-rosewood/95" />
            <div className="absolute inset-0 bg-gradient-to-tr from-cypress/40 via-transparent to-poppy/30" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 pt-6 md:pt-8 pb-16 md:pb-24 max-w-5xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-plaster/70 hover:text-plaster font-host-grotesk text-sm mb-10 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              {/* <div className="flex items-center justify-center gap-3 mb-4">
                <span className="w-8 h-px bg-chartreuse/60" />
                <span className="font-host-grotesk text-[10px] sm:text-xs text-chartreuse uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                  <Snowflake className="w-3 h-3" />
                  Bazaar47 × Big CAAF
                  <Snowflake className="w-3 h-3" />
                </span>
                <span className="w-8 h-px bg-chartreuse/60" />
              </div> */}

              <h1 className="font-host-grotesk-narrow font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-plaster leading-[0.9] drop-shadow-lg">
                {MARKET_COPY.title}
              </h1>
              <p className="font-host-grotesk text-lg sm:text-xl md:text-2xl text-chartreuse mt-4 font-semibold">
                {MARKET_COPY.subtitle}
              </p>
              <p className="font-host-grotesk text-sm sm:text-base text-plaster/70 mt-4 max-w-2xl mx-auto">
                {MARKET_COPY.intro}
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/winter-market/apply"
                  className="inline-flex items-center gap-2 bg-chartreuse hover:bg-plaster text-grove hover:text-rosewood font-host-grotesk font-bold text-base px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg"
                >
                  Apply to Vend
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================
            DETAIL STRIP — colored cards
            ============================================ */}
        <section className="relative -mt-8 md:-mt-10 z-20 container mx-auto px-4 sm:px-6 md:px-8 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center p-5 bg-cypress text-plaster rounded-2xl shadow-lg"
            >
              <MapPin className="w-5 h-5 text-chartreuse mb-2" />
              <span className="font-host-grotesk text-[10px] text-plaster/60 uppercase tracking-wider">
                Where
              </span>
              <span className="font-host-grotesk font-bold text-sm mt-1">
                {VENUE_NAME}
              </span>
              <span className="font-host-grotesk text-xs text-plaster/60 mt-0.5">
                {VENUE_ADDRESS}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center p-5 bg-henna text-plaster rounded-2xl shadow-lg"
            >
              <Calendar className="w-5 h-5 text-hippie mb-2" />
              <span className="font-host-grotesk text-[10px] text-plaster/60 uppercase tracking-wider">
                When
              </span>
              <span className="font-host-grotesk font-bold text-sm mt-1">
                Saturdays
              </span>
              <span className="font-host-grotesk text-xs text-plaster/60 mt-0.5">
                Nov 21, 2026 – Jan 2, 2027
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center p-5 bg-grove text-plaster rounded-2xl shadow-lg"
            >
              <Clock className="w-5 h-5 text-chartreuse mb-2" />
              <span className="font-host-grotesk text-[10px] text-plaster/60 uppercase tracking-wider">
                Hours
              </span>
              <span className="font-host-grotesk font-bold text-sm mt-1">
                {MARKET_HOURS}
              </span>
            </motion.div>
          </div>
        </section>

        {/* ============================================
            ABOUT — split layout with accent block
            ============================================ */}
        <section className="container mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-20 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="md:col-span-2"
            >
              <div className="inline-flex items-center gap-2 bg-hippie text-rosewood px-3 py-1 rounded-full mb-4">
                <Sparkles className="w-3 h-3" />
                <span className="font-host-grotesk text-[10px] uppercase tracking-wider font-bold">
                  About the Market
                </span>
              </div>
              <h2 className="font-host-grotesk-narrow font-black text-4xl md:text-5xl text-rosewood leading-[0.95]">
                A winter gathering under the lights.
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="md:col-span-3 bg-white rounded-3xl border-2 border-rosewood/10 p-6 sm:p-8 shadow-sm"
            >
              {MARKET_COPY.about.map((p, i) => (
                <p
                  key={i}
                  className="font-host-grotesk text-rosewood/75 leading-relaxed mb-3 last:mb-0"
                >
                  {p}
                </p>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================================
            WHAT TO EXPECT — colored card grid
            ============================================ */}
        <section className="bg-grove py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="w-8 h-px bg-chartreuse/60" />
                <span className="font-host-grotesk text-[10px] sm:text-xs text-chartreuse uppercase tracking-[0.3em] font-bold">
                  What to Expect
                </span>
                <span className="w-8 h-px bg-chartreuse/60" />
              </div>
              <h2 className="font-host-grotesk-narrow font-black text-4xl md:text-5xl text-plaster leading-[0.95]">
                More than a market.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {expectations.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className={`${f.bg} ${f.text} rounded-3xl p-6 shadow-lg hover:-translate-y-1 transition-transform duration-300`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${f.iconBg} flex items-center justify-center mb-4`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-host-grotesk font-black text-xl mb-2">
                    {f.title}
                  </h3>
                  <p className="font-host-grotesk text-sm leading-relaxed opacity-80">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            GALLERY — asymmetric grid, high-res
            ============================================ */}
        <section className="container mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-20 max-w-5xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <Image src={overlay} alt="" fill className="object-cover" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-8 flex-wrap gap-3"
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-petal text-henna px-3 py-1 rounded-full mb-3">
                <Star className="w-3 h-3" />
                <span className="font-host-grotesk text-[10px] uppercase tracking-wider font-bold">
                  Gallery
                </span>
              </div>
              <h2 className="font-host-grotesk-narrow font-black text-4xl md:text-5xl text-rosewood leading-[0.95]">
                Last winter, in pictures.
              </h2>
            </div>
            <p className="font-host-grotesk text-sm text-rosewood/50 max-w-xs">
              A peek at the 2025 Winter Market at The Streatery — vendors, lights, music, and community.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[140px] sm:auto-rows-[180px] md:auto-rows-[200px]">
            {galleryImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl overflow-hidden border border-rosewood/10 bg-rosewood/5 group ${img.span}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  quality={95}
                  unoptimized={false}
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
                {/* Hover caption overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-rosewood/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <p className="font-host-grotesk text-xs text-plaster font-semibold">
                    {img.alt}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="font-host-grotesk text-xs text-rosewood/40 mt-4 text-center">
            Photos from last year&apos;s Winter Market at The Streatery.
          </p>
        </section>

        {/* ============================================
            CTA — full bleed, pomegranate accent
            ============================================ */}
        <section className="relative bg-poppy overflow-hidden">
          {/* Decorative background patterns */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <Image src={overlay} alt="" fill className="object-cover" />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-chartreuse/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-plaster/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 py-20 md:py-24 max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="w-8 h-px bg-plaster/40" />
                <Users className="w-4 h-4 text-chartreuse" />
                <span className="font-host-grotesk text-[10px] sm:text-xs text-plaster/90 uppercase tracking-[0.3em] font-bold">
                  Vendor Application
                </span>
                <span className="w-8 h-px bg-plaster/40" />
              </div>

              <h2 className="font-host-grotesk-narrow font-black text-5xl md:text-6xl lg:text-7xl text-plaster leading-[0.95] drop-shadow-md">
                Want to vend?
              </h2>
              
              <p className="font-host-grotesk text-lg md:text-xl text-plaster/90 mt-6 mb-10 max-w-xl mx-auto leading-relaxed">
                {MARKET_COPY.vendorPitch}
              </p>

              <Link
                href="/winter-market/apply"
                className="inline-flex items-center gap-2 bg-chartreuse hover:bg-plaster text-grove hover:text-rosewood font-host-grotesk font-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-xl"
              >
                Apply to Vend
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}