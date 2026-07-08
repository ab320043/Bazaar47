'use client'

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    // avoid calling setState synchronously inside the effect to prevent
    // cascading renders; schedule update microtask instead
    Promise.resolve().then(() => setMatches(media.matches))

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}