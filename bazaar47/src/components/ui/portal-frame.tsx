'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type FrameVariant = 'arch' | 'doorway' | 'decorative'

interface PortalFrameProps {
  children: ReactNode
  variant?: FrameVariant
  className?: string
  fillColor?: string
  hoverEffect?: boolean
  onClick?: () => void
}

const framePaths = {
  arch: 'M0,0 L100,0 L100,80 C100,90 90,100 50,100 C10,100 0,90 0,80 L0,0',
  doorway: 'M0,0 L100,0 L100,100 L80,100 L80,40 L20,40 L20,100 L0,100 L0,0',
  decorative: 'M0,0 L100,0 L100,100 L0,100 L0,0 M10,10 L90,10 L90,90 L10,90 L10,90 L10,10 L10,10',
}

export function PortalFrame({
  children,
  variant = 'arch',
  className,
  fillColor = '#EFEADE',
  hoverEffect = false,
  onClick,
}: PortalFrameProps) {
  return (
    <motion.div
      className={cn(
        'relative aspect-square w-full max-w-[400px] mx-auto cursor-pointer rounded-lg shadow-lg',
        'bg-plaster dark:bg-grove/80 border border-sand-dune/30 dark:border-cypress/30',
        className
      )}
      whileHover={hoverEffect ? { scale: 1.03, boxShadow: '0 20px 60px rgba(52,27,28,0.15)' } : undefined}
      transition={{ duration: 0.4 }}
      onClick={onClick}
    >
      {/* Frame SVG */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <motion.path
          d={framePaths[variant]}
          fill={fillColor}
          stroke="#A62630"
          strokeWidth="0.5"
          className="text-henna/20 dark:text-henna/30"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </svg>
      
      {/* Content */}
      <div className="relative z-10 p-8 flex items-center justify-center h-full">
        {children}
      </div>
    </motion.div>
  )
}