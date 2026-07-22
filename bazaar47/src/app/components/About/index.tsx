'use client'

import { AboutTitle } from './aboutTitle'
import { AboutVideo } from './AboutVideo'
import { AboutDescription } from './AboutDescription'
import { AboutTourPromo } from './AboutTourPromo'

const originalDescriptionSentences = [
  "Formerly known as How Bazar, Bazaar47, located at 60 S.W. 2nd St. in downtown Gainesville, is a third place and event venue dedicated to bringing people together through diverse experiences while making it easier for others to create experiences of their own.",
  "Through hosting events like open mics, creator meetups, artisan markets, workshops, live music and performances, Bazaar47 aims to create space for community, creativity, openness, curiosity and belonging."
]

export function About() {
  return (
    <section className="w-full overflow-hidden bg-plaster relative">
      
      {/* Title */}
      <AboutTitle />

      {/* Video */}
      <AboutVideo />

      {/* Original Description */}
      <AboutDescription sentences={originalDescriptionSentences} />

      {/* Tour Promo - 50/50 split */}
      <AboutTourPromo />

    </section>
  )
}