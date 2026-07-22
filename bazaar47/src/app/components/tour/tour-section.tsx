'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'
import floridaTourText from '@/assets/newAssets/floridaTourText.png'
import { tourData } from '@/data/tour-data'

import cardLocationIcon from '@/assets/newAssets/cardLocationIcon.png'

export function TourSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#6A2630]" id="tour-section">

      {/* ============================================
          OVERLAY LAYER
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

      <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-20">

        {/* ============================================
            HEADER - Tickets + Dates with Banner
            ============================================ */}
        <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between gap-6 mb-12">
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h2 className="font-host-grotesk font-bold text-[40px] md:text-[58px] leading-[108%] tracking-normal text-plaster mt-12">
              Tickets + Dates
            </h2>
          </div>
          <div className="w-full md:w-1/2 flex justify-center md:justify-end">
            <div className="relative w-full max-w-[150px] md:max-w-[180px] h-auto" style={{ right: '0px', top: '6px' }}>
              <Image
                src={floridaTourText}
                alt="Bazaar À La Carte"
                className="object-contain w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* ============================================
            TOUR CARDS - Responsive Grid
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {tourData.map((stop, index) => {
            const isTampa = stop.id === 'tampa'
            
            return (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className={`mx-auto w-full rounded-[15px] border-2 overflow-hidden flex flex-col ${
                  isTampa 
                    ? 'border-chartreuse/30 bg-chartreuse/5' 
                    : 'border-[#341B1C] bg-plaster'
                }`}
              >
                {/* ============================================
                    TOP - Image (fixed aspect ratio, no crop)
                    Tampa: No image, just "Coming Soon" overlay
                    ============================================ */}
                <div className="relative w-full aspect-[4/3] shrink-0">
                  {isTampa ? (
                    // Tampa: Coming Soon placeholder
                    <div className="w-full h-full bg-[#341B1C]/20 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-chartreuse/10 flex items-center justify-center mb-4">
                        <span className="text-3xl">📍</span>
                      </div>
                      <h4 className="font-host-grotesk font-bold text-2xl text-plaster/40">
                        Coming Soon
                      </h4>
                      <p className="font-host-grotesk text-sm text-plaster mt-1 max-w-[200px]">
                        Tampa details are on the way. Stay tuned!
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="w-6 h-px bg-chartreuse/20" />
                        <span className="text-chartreuse/20 text-xs">✦</span>
                        <span className="w-6 h-px bg-chartreuse/20" />
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={stop.image}
                      alt={stop.city}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* ============================================
                    BOTTOM - Content (auto height, no clipping)
                    ============================================ */}
                <div className={`flex flex-col px-4 py-4 grow ${
                  isTampa ? 'bg-plaster' : 'bg-plaster'
                }`}>
                  {/* City + Badge Row */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-host-grotesk text-[24px] md:text-[30px] font-bold leading-tight ${
                      isTampa ? 'text-[#341B1C]' : 'text-[#341B1C]'
                    }`}>
                      {stop.city}
                    </h3>
                    {!isTampa && (
                      <span className="shrink-0 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-[14px] md:text-[18px] font-bold leading-none bg-chartreuse text-[#295211]">
                        {stop.badge}
                      </span>
                    )}
                    {isTampa && (
                      <span className="shrink-0 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-[14px] md:text-[18px] font-bold leading-none bg-chartreuse/20 text-text-[#341B1C] border border-chartreuse/30">
                        TBA
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <p className={`mt-2 font-host-grotesk text-[16px] md:text-[18px] font-semibold ${
                    isTampa ? 'text-[#341B1C]' : 'text-[#341B1C]'
                  }`}>
                    {stop.date}
                  </p>

                  {/* Location + Time */}
                  <div className={`mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 ${
                    isTampa ? 'text-[#341B1C]' : 'text-[#341B1C]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Image src={cardLocationIcon} alt="Location" width={18} height={18} className="text-poppy opacity-50" />
                      <span className="font-host-grotesk text-sm font-semibold">{stop.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-poppy opacity-50" />
                      <span className="font-host-grotesk text-sm font-semibold">{stop.time}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <hr className={`my-3 md:my-4 ${
                    isTampa ? '[#341B1C]/20' : 'border-[#341B1C]/20'
                  }`} />

                  {/* Description */}
                  <p className={`font-host-grotesk text-[14px] font-normal leading-[140%] tracking-[0] ${
                    isTampa ? 'text-text-[#341B1C]' : 'text-[#341B1C]'
                  }`}>
                    {stop.description}
                  </p>

                  {/* Divider */}
                  <hr className={`my-3 md:my-4 ${
                    isTampa ? '[#341B1C]/20' : 'border-[#341B1C]/20'
                  }`} />

                  {/* Button - Special handling for Tampa */}
                  <div className="w-full mt-auto">
                    {isTampa ? (
                      <button 
                        className="w-full rounded-2xl bg-[#341B1C] border border-chartreuse/20 h-12 md:h-14 text-center font-host-grotesk text-[16px] md:text-[20px] font-semibold text-plaster cursor-default"
                        disabled
                      >
                        {stop.price}
                      </button>
                    ) : (
                      <Link href={`/tours/${stop.id}`} className="w-full">
                        <button className="w-full rounded-2xl bg-[#341B1C] h-12 md:h-14 text-center font-host-grotesk text-[16px] md:text-[20px] font-semibold text-plaster transition hover:opacity-90">
                          {stop.price} →
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}