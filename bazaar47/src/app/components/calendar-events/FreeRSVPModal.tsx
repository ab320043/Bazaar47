// app/components/calendar-events/FreeRSVPModal.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Users } from 'lucide-react'
import type { Workshop } from './workshops-data'

interface FreeRSVPModalProps {
  workshop: Workshop
  isOpen: boolean
  onClose: () => void
}

export function FreeRSVPModal({ workshop, isOpen, onClose }: FreeRSVPModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: '1'
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            workshop: workshop.title,
            workshopId: workshop.id,
            ...formData,
            timestamp: new Date().toISOString(),
          },
          type: 'workshop-rsvp',
        }),
      })
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('RSVP failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-henna rounded-2xl max-w-md w-full border-2 border-plaster/20 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{workshop.icon}</span>
                    <span className="font-host-grotesk font-bold text-chartreuse text-xs uppercase tracking-wider">
                      Free RSVP
                    </span>
                  </div>
                  <h3 className="font-host-grotesk font-black text-lg text-plaster">
                    {workshop.title}
                  </h3>
                  <p className="font-host-grotesk text-plaster/50 text-xs mt-0.5">
                    {workshop.time} · {workshop.table}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-rosewood/30 hover:bg-rosewood/50 text-plaster/60 hover:text-plaster transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-host-grotesk font-semibold text-plaster/80 text-sm mb-1.5">
                      Full Name <span className="text-poppy">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 bg-sand-dune/20 border-2 border-plaster/20 rounded-xl font-host-grotesk text-plaster placeholder-plaster/40 focus:outline-none focus:border-chartreuse transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-host-grotesk font-semibold text-plaster/80 text-sm mb-1.5">
                      Email <span className="text-poppy">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-sand-dune/20 border-2 border-plaster/20 rounded-xl font-host-grotesk text-plaster placeholder-plaster/40 focus:outline-none focus:border-chartreuse transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-host-grotesk font-semibold text-plaster/80 text-sm mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(352) 123-4567"
                      className="w-full px-4 py-3 bg-sand-dune/20 border-2 border-plaster/20 rounded-xl font-host-grotesk text-plaster placeholder-plaster/40 focus:outline-none focus:border-chartreuse transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-host-grotesk font-semibold text-plaster/80 text-sm mb-1.5">
                      Number of Guests <span className="text-poppy">*</span>
                    </label>
                    <input
                      type="number"
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      required
                      min="1"
                      max="10"
                      className="w-full px-4 py-3 bg-sand-dune/20 border-2 border-plaster/20 rounded-xl font-host-grotesk text-plaster placeholder-plaster/40 focus:outline-none focus:border-chartreuse transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full font-host-grotesk font-bold text-henna bg-chartreuse hover:bg-plaster px-6 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Users className="w-5 h-5" />
                    {isLoading ? 'Submitting...' : 'RSVP Free'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-chartreuse rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-henna" />
                  </div>
                  <h4 className="font-host-grotesk font-bold text-xl text-plaster mb-1">
                    RSVP Confirmed! 🎉
                  </h4>
                  <p className="font-host-grotesk text-plaster/60 text-sm">
                    See you at {workshop.title}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 font-host-grotesk font-bold text-henna bg-plaster hover:bg-sand-dune px-6 py-2 rounded-lg transition-all duration-300 text-sm"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}