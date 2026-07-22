'use client'

import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function AboutVideo() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      viewport={{ once: true }}
      className="relative w-full overflow-hidden"
    >
      <video
        ref={videoRef}
        className="block w-full h-auto min-h-[250px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-[500px] object-cover rounded-t-[24px] md:rounded-t-[32px]"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        onClick={togglePlay}
      >
        <source src="/videos/Storytime.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 z-10 bg-[#341B1C]/60 backdrop-blur-sm text-plaster p-2 rounded-full hover:bg-[#341B1C]/80 transition-all duration-300 border border-plaster/10"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>

      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 left-4 text-chartreuse/40 font-host-grotesk text-[10px] tracking-widest uppercase bg-[#341B1C]/40 px-3 py-1 rounded-full backdrop-blur-sm"
        >
          {isMuted ? '🔇 Muted' : '🔊 Playing'}
        </motion.div>
      )}
    </motion.div>
  )
}