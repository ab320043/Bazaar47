'use client'

import { Button } from '@/app/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function HeroButtons() {
  return (
    <div className="flex flex-wrap gap-4 mt-8">
      <Button 
        variant="primary" 
        size="lg"
        className="group bg-cypress hover:bg-cypress/90 text-plaster dark:bg-chartreuse dark:hover:bg-chartreuse/90 dark:text-grove px-8 py-4 text-lg rounded-none"
      >
        Explore Collection
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>
      <Button 
        variant="secondary" 
        size="lg"
        className="bg-plaster/10 hover:bg-plaster/20 text-plaster border border-plaster/30 backdrop-blur-sm dark:bg-grove/20 dark:hover:bg-grove/30 px-8 py-4 text-lg rounded-none"
      >
        View Events
      </Button>
    </div>
  )
}