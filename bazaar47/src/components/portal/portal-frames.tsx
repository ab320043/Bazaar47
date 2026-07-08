'use client'

import { motion } from 'framer-motion'
import { SectionContainer } from '@/components/ui/section-container'
import { Heading } from '@/components/ui/heading'
import { PortalFrame } from '@/components/ui/portal-frame'
import { ChevronRight } from 'lucide-react'

const portalLinks = [
  {
    title: 'Shop',
    description: 'Explore our collection',
    href: '/shop',
    variant: 'arch' as const,
  },
  {
    title: 'Tours',
    description: 'Join the experience',
    href: '/tours',
    variant: 'doorway' as const,
  },
  {
    title: 'Events',
    description: 'Upcoming gatherings',
    href: '/events',
    variant: 'decorative' as const,
  },
]

export function PortalFrames() {
  return (
    <SectionContainer background="accent" spacing="xl">
      <div className="text-center mb-16">
        <Heading as="h2" className="text-rosewood">
          Explore Bazaar 47
        </Heading>
        <div className="w-16 h-0.5 bg-chartreuse mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {portalLinks.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <PortalFrame
              variant={item.variant}
              fillColor="#EFEADE"
              hoverEffect
              onClick={() => console.log(`Navigate to ${item.href}`)}
            >
              <div className="text-center p-4">
                <h3 className="font-period-narrow font-bold text-3xl text-rosewood">
                  {item.title}
                </h3>
                <p className="font-period text-sm text-henna/70 mt-2">
                  {item.description}
                </p>
                <div className="flex justify-center mt-4">
                  <ChevronRight className="w-6 h-6 text-henna/50" />
                </div>
              </div>
            </PortalFrame>
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  )
}