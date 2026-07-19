'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function HeroVideo() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const video = document.getElementById('hero-video') as HTMLVideoElement
    if (video) {
      video.addEventListener('loadeddata', () => setIsLoading(false))
    }
  }, [])

  return (
    <>
      <video
        id="hero-video"
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/images/hero-poster.jpg"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
        <source src="/videos/hero.webm" type="video/webm" />
      </video>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-rosewood"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </>
  )
}