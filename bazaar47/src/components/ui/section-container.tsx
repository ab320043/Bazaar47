import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionContainerProps {
  children: ReactNode
  className?: string
  background?: 'light' | 'dark' | 'accent' | 'transparent'
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
  }

  const spacingClasses = {
    sm: 'py-12',
    md: 'py-24',
    lg: 'py-32',
    xl: 'py-48',
  }

  return (
    <section className={cn(bgClasses[background], spacingClasses[spacing], className)}>
      <div className="container mx-auto px-4">{children}</div>
    </section>
  )
}