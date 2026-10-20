'use client'

import { useState, useSyncExternalStore } from 'react'
import { Share, Plus } from 'lucide-react'

const subscribeToDisplayMode = (onChange: () => void) => {
  const mediaQuery = window.matchMedia('(display-mode: standalone)')
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

const getDeviceState = () => {
  const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
  const standalone = window.matchMedia('(display-mode: standalone)').matches
  return (ios ? 1 : 0) | (standalone ? 2 : 0)
}

export function IosInstallPrompt() {
  const deviceState = useSyncExternalStore(subscribeToDisplayMode, getDeviceState, () => 0)
  const isIos = (deviceState & 1) !== 0
  const isStandalone = (deviceState & 2) !== 0
  const [dismissed, setDismissed] = useState(false)

  if (!isIos || isStandalone || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-grove text-plaster rounded-2xl p-4 shadow-2xl border border-plaster/20 max-w-sm mx-auto">
      <p className="font-host-grotesk font-semibold text-sm mb-2">
        Install Bazaar47 on your phone
      </p>
      <p className="font-host-grotesk text-xs text-plaster/70 mb-3">
        Tap the Share button below, then choose{' '}
        <span className="inline-flex items-center gap-1 font-semibold">
          <Plus className="w-3 h-3" /> Add to Home Screen
        </span>
      </p>
      <div className="flex items-center justify-between">
        <Share className="w-5 h-5 text-chartreuse" />
        <button
          onClick={() => setDismissed(true)}
          className="text-xs font-host-grotesk text-plaster/50 hover:text-plaster transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}