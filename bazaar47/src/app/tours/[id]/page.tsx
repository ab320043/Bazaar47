'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { tourData } from '@/data/tour-data'
import overlay from '@/assets/newAssets/overlay.png'
import { CityHero } from './components/CityHero'
import { CityAbout } from './components/CityAbout'
import { CityRSVPForm } from './components/CityRSVPForm'
import { CityShare } from './components/CityShare'

export default function TourCityPage() {
  const params = useParams()
  const cityId = params.id as string
  
  const city = tourData.find(t => t.id === cityId)

  if (!city) {
    return (
      <div className="min-h-screen bg-plaster flex items-center justify-center pt-20">
        <div className="text-center px-4">
          <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">City not found</h1>
          <Link href="/" className="text-chartreuse hover:underline mt-4 inline-block font-host-grotesk">
            ← Back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-[#341B1C]">
      
      {/* Hero */}
      <CityHero city={city} />

      {/* Split Section */}
      <div className="relative w-full">
        {/* Backgrounds */}
        <div className="lg:hidden absolute inset-0 bg-[#341B1C]">
          <div className="absolute inset-0 opacity-30">
            <Image src={overlay} alt="" fill className="object-cover" priority />
          </div>
        </div>
        <div className="hidden lg:block absolute inset-0 lg:right-1/2 bg-[#341B1C]">
          <div className="absolute inset-0 opacity-30">
            <Image src={overlay} alt="" fill className="object-cover" priority />
          </div>
        </div>
        <div className="hidden lg:block absolute inset-0 lg:left-1/2 bg-plaster" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 md:py-12 lg:py-16">
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-0 max-w-6xl mx-auto">
            
            {/* Left: About the Venue */}
            <CityAbout city={city} />

            {/* Right: RSVP Form */}
            <CityRSVPForm city={city} />
            
          </div>

          {/* Share Section */}
          <CityShare cityName={city.city} />
          
        </div>
      </div>

    </section>
  )
}