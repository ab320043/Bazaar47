import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionContainerProps {
  children: ReactNode
  className?: string
  background?: 'light' | 'dark' | 'accent' | 'transparent' | 'warm'
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
}

export function SectionContainer({
  children,
  className,
  background = 'light',
  spacing = 'lg',
}: SectionContainerProps) {
  const bgClasses = {
    light: 'bg-plaster',
    dark: 'bg-rosewood text-plaster',
    accent: 'bg-sand-dune',
    transparent: 'bg-transparent',
    warm: 'bg-gradient-to-b from-plaster via-plaster to-sand-dune/30',
  }

  const spacingClasses = {
    sm: 'py-12',
    md: 'py-20',
    lg: 'py-24',
    xl: 'py-32',
  }

  return (
    <section className={cn(bgClasses[background], spacingClasses[spacing], className)}>
      <div className="container mx-auto px-4">{children}</div>
    </section>
  )
}