'use client'

import { motion } from 'framer-motion'
import { Heart, Share2 } from 'lucide-react'
import { useState } from 'react'

interface CityShareProps {
  cityName: string
}

export function CityShare({ cityName }: CityShareProps) {
  const [isLiked, setIsLiked] = useState(false)

  const handleShare = async () => {
    const shareData = {
      title: `Bazaar À La Carte - ${cityName}`,
      text: `Join us at ${cityName} for the Bazaar À La Carte Florida Tour 2026! 🎉`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.log('Share cancelled or failed')
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `${shareData.text}\n\n${shareData.url}`
        )
        alert('Link copied to clipboard! Share it with your friends. ✨')
      } catch (err) {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(
          `${shareData.text}\n\n${shareData.url}`
        )}`
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="max-w-6xl mx-auto mt-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#D5C9B1]/10"
    >
      <p className="font-host-grotesk text-xs sm:text-sm text-[#D5C9B1]/30">
        ✦ Part of the Bazaar À La Carte Florida Tour 2026
      </p>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className={`transition-all duration-300 hover:scale-110 ${
            isLiked ? 'text-poppy' : 'text-[#D5C9B1]/30 hover:text-[#D5C9B1]/60'
          }`}
          aria-label="Like"
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-poppy' : ''}`} />
        </button>
        
        <button 
          onClick={handleShare}
          className="text-[#D5C9B1]/30 hover:text-[#D5C9B1]/60 transition-all duration-300 hover:scale-110"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}