'use client'

import { motion } from 'framer-motion'
import { SectionContainer } from '@/components/ui/section-container'
import { Heading } from '@/components/ui/heading'
import { PortalFrame } from '@/components/ui/portal-frame'
import { Button } from '@/components/ui/button'
import { tourData } from '@/data/tour-data'

export function TourSection() {
  return (
    <SectionContainer background="light" spacing="xl">
      <div className="text-center mb-16">
        <Heading as="h2" narrow>
          Bazaar à la Carte
        </Heading>
        <p className="font-period text-xl text-henna mt-2">
          Florida Tour 2026
        </p>
        <div className="w-16 h-0.5 bg-chartreuse mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {tourData.map((stop, index) => (
          <motion.div
            key={stop.city}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <PortalFrame
              variant="doorway"
              fillColor="#EFEADE"
              hoverEffect
            >
              <div className="text-center p-4">
                <h3 className="font-period-narrow font-bold text-2xl text-rosewood">
                  {stop.city}
                </h3>
                <p className="font-period text-sm text-henna mt-1">
                  {stop.date}
                </p>
                <p className="font-period text-sm text-sand-dune mt-0.5">
                  {stop.venue}
                </p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="mt-4 w-full"
                  onClick={() => console.log(`Tickets for ${stop.city}`)}
                >
                  Get Tickets
                </Button>
              </div>
            </PortalFrame>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Button variant="secondary" size="lg">
          View Full Tour Schedule
        </Button>
      </div>
    </SectionContainer>
  )
}