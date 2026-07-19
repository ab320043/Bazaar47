import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HeadingProps {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4'
  className?: string
  narrow?: boolean
  italic?: boolean
}

export function Heading({
  children,
  as: Component = 'h2',
  className,
  narrow = false,
  italic = false,
}: HeadingProps) {
  return (
    <Component
      className={cn(
        narrow ? 'font-host-grotesk-narrow' : 'font-host-grotesk',
        'font-bold',
        italic && 'italic',
        {
          'text-5xl md:text-7xl': Component === 'h1',
          'text-4xl md:text-6xl': Component === 'h2',
          'text-3xl md:text-5xl': Component === 'h3',
          'text-2xl md:text-4xl': Component === 'h4',
        },
        className
      )}
    >
      {children}
    </Component>
  )
}