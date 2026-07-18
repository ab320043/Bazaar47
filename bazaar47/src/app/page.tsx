import { Hero } from '@/components/hero/hero'
// import { PortalFrames } from '@/components/portal/portal-frames'
import { TourSection } from '@/components/tour/tour-section'
import { SectionContainer } from '@/components/ui/section-container'
import { Heading } from '@/components/ui/heading'

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* <PortalFrames /> */}
      <TourSection />
      
      {/* Placeholder for future sections */}
      <SectionContainer background="transparent" spacing="md">
        <div className="text-center">
          <Heading as="h3">Coming Soon</Heading>
          <p className="font-period text-sand-dune mt-2">
            More sections will appear here
          </p>
        </div>
      </SectionContainer>
    </>
  )
}