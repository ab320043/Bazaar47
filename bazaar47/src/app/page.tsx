// src/app/page.tsx
import { Hero } from '@/app/components/hero/hero'
import { TourSection } from '@/app/components/tour/tour-section'
import { About } from '@/app/components/About/index'
import { WinterMarketSection } from '@/app/components/winter-market/winter-market-section'  // NEW
import { OpenMicSection } from '@/app/components/open-mic/open-mic-section'

export default function HomePage() {
  return (
    <>
      <Hero />
      <section id="about"><About /></section>
      <WinterMarketSection />   {/* NEW */}
      <OpenMicSection />
      <section id="tickets"><TourSection /></section>
    </>
  )
}