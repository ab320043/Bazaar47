// app/admin/open-mic/Toast.tsx
'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export type ToastKind = 'success' | 'error'

export interface ToastInput {
  kind: ToastKind
  title: string
  message?: string
  /** Auto-dismiss delay in ms. Default 4000. Set to 0 to disable. */
  duration?: number
}

interface ToastRecord extends ToastInput {
  id: number
}

interface ToastContextValue {
  showToast: (input: ToastInput) => void
}

// ============================================
// CONTEXT
// ============================================

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>')
  }
  return ctx
}

// ============================================
// PROVIDER
// ============================================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.random()
      const duration = input.duration ?? 4000
      setToasts((prev) => [...prev, { id, ...input }])
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast stack — bottom-right, above page content */}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border bg-white ${
                toast.kind === 'success'
                  ? 'border-chartreuse/40'
                  : 'border-poppy/40'
              }`}
            >
              {toast.kind === 'success' ? (
                <CheckCircle className="w-5 h-5 text-chartreuse shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-poppy shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-host-grotesk font-semibold text-sm text-rosewood">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="font-host-grotesk text-xs text-rosewood/60 mt-0.5">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-rosewood/30 hover:text-rosewood/60 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}