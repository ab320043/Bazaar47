import { Hero } from '@/app/components/hero/hero'
import { TourSection } from '@/app/components/tour/tour-section'
import { About } from '@/app/components/About/index'
import { CalendarEventsSection } from '@/app/components/calendar-events/index'

export default function HomePage() {
  return (
    <>
      <Hero />
      <section id="about"> 
        <About />
      </section>
      <section id="tickets">   
        <TourSection />
      </section>
      <CalendarEventsSection />
    </>
  )
}