import { Hero } from '@/app/components/hero/hero'
// import { SectionContainer } from '@/components/ui/section-container'
// import { Heading } from '@/components/ui/heading'
import { TourSection } from '@/app/components/tour/tour-section'
import { About } from '@/app/components/About/about'

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
    </>
  )
}