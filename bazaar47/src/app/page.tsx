// app/page.tsx
import { Hero } from '@/app/components/hero/hero'
import { TourSection } from '@/app/components/tour/tour-section'
import { About } from '@/app/components/About/index'
// import { CalendarEventsSection } from '@/app/components/calendar-events/index'
import { ReopeningSection } from '@/app/components/reopening/reopening-section'
import { OpenMicSection } from '@/app/components/open-mic/open-mic-section'

export default function HomePage() {
  return (
    <>
      <Hero />

      <section id="about">
        <About />
      </section>

      {/* Grand Reopening — two-in-one celebration */}
      <ReopeningSection />

      {/* Open Mic — every Wednesday */}
      <OpenMicSection />

      {/* Florida Tour — final stops */}
      <section id="tickets">
        <TourSection />
      </section>

      {/* <CalendarEventsSection /> */}
    </>
  )
}