'use client'

import { motion } from 'framer-motion'
import { Send, CreditCard, Ticket } from 'lucide-react'
import { useState } from 'react'
import { TourCity } from '@/data/tour-data'

interface CityRSVPFormProps {
  city: TourCity
}

export function CityRSVPForm({ city }: CityRSVPFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    city: '',
    instagram: '',
    zipCode: '',
    tickets: '1'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'free' | 'card'>('free')
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvc: ''
  })

  // Check if this is a paid event (South Florida)
  const isPaidEvent = city.id === 'south-florida'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardDetails({ ...cardDetails, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In production, this would send to your backend/stripe
      const response = await fetch('https://formspree.io/f/mpqvlgkb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          eventCity: city.city,
          isPaidEvent,
          paymentMethod: isPaidEvent ? paymentMethod : 'free',
          cardDetails: isPaidEvent && paymentMethod === 'card' ? cardDetails : null,
          totalPrice: isPaidEvent ? `$${parseInt(formData.tickets || '1') * 10}` : 'Free',
          _subject: `RSVP for ${city.city} - Bazaar À La Carte`,
          _replyto: formData.email,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        setFormData({ fullName: '', email: '', city: '', instagram: '', zipCode: '', tickets: '1' })
        setCardDetails({ cardNumber: '', expiry: '', cvc: '' })
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch (error) {
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTicketPrice = () => {
    if (city.id === 'south-florida') {
      const qty = parseInt(formData.tickets || '1')
      return `$${qty * 10}`
    }
    return 'Free'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="lg:w-1/2 bg-plaster rounded-2xl lg:rounded-none p-6 sm:p-8 lg:p-0 lg:pl-8 xl:pl-12"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-host-grotesk font-bold text-2xl sm:text-3xl md:text-4xl text-[#6A2630]">
            {isPaidEvent ? 'Buy Tickets' : 'RSVP'} for {city.city}
          </h2>
          {isPaidEvent && (
            <span className="text-sm font-host-grotesk font-bold text-chartreuse bg-chartreuse/10 px-3 py-1 rounded-full">
              ${parseInt(formData.tickets || '1') * 10}
            </span>
          )}
        </div>
        
        {isSuccess ? (
          <div className="bg-chartreuse/10 border border-chartreuse/30 rounded-xl p-6 text-center">
            <p className="font-host-grotesk text-lg font-semibold text-[#6A2630]">
              {isPaidEvent ? '🎉 Payment Successful!' : '🎉 You\'re RSVP\'d!'}
            </p>
            <p className="font-host-grotesk text-sm text-[#6A2630]/60 mt-2">
              {isPaidEvent 
                ? `Your tickets for ${city.city} have been confirmed! Check your email for details.`
                : `We'll see you at ${city.city}! Check your email for details.`
              }
            </p>
            <button 
              onClick={() => setIsSuccess(false)}
              className="mt-4 text-chartreuse font-bold text-sm hover:underline"
            >
              Submit another {isPaidEvent ? 'order' : 'RSVP'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                Full Name <span className="text-poppy">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                Email <span className="text-poppy">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                  Your City <span className="text-poppy">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                  placeholder="e.g. Gainesville"
                />
              </div>
              <div>
                <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                  {isPaidEvent ? 'Tickets' : 'Tickets'} <span className="text-poppy">*</span>
                </label>
                <input
                  type="number"
                  name="tickets"
                  min="1"
                  max="10"
                  value={formData.tickets}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                  placeholder="Qty"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                  Instagram
                </label>
                <div className="flex items-center">
                  <span className="font-host-grotesk text-[#6A2630]/40 bg-plaster/50 px-3 py-2.5 rounded-l-xl border border-r-0 border-[#6A2630]/20">@</span>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                    placeholder="handle"
                  />
                </div>
              </div>
              <div>
                <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                  Zip Code <span className="text-poppy">*</span>
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-plaster/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                  placeholder="e.g. 32601"
                />
              </div>
            </div>

            {/* Payment Section - Only for South Florida */}
            {isPaidEvent && (
              <div className="bg-[#6A2630]/5 rounded-xl p-4 border border-[#6A2630]/10">
                <div className="flex items-center gap-2 mb-3">
                  <Ticket className="w-4 h-4 text-[#6A2630]" />
                  <span className="font-host-grotesk font-semibold text-sm text-[#6A2630]">
                    Payment: {getTicketPrice()} ({formData.tickets || 1} ticket{parseInt(formData.tickets || '1') > 1 ? 's' : ''})
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-host-grotesk font-semibold text-xs text-[#6A2630] block mb-1">
                      Payment Method <span className="text-poppy">*</span>
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 px-3 py-2 rounded-xl border text-sm font-host-grotesk transition-all ${
                          paymentMethod === 'card'
                            ? 'border-chartreuse bg-chartreuse/10 text-[#6A2630]'
                            : 'border-[#6A2630]/20 text-[#6A2630]/50 hover:border-[#6A2630]/40'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 inline mr-1" />
                        Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('free')}
                        className={`flex-1 px-3 py-2 rounded-xl border text-sm font-host-grotesk transition-all ${
                          paymentMethod === 'free'
                            ? 'border-chartreuse bg-chartreuse/10 text-[#6A2630]'
                            : 'border-[#6A2630]/20 text-[#6A2630]/50 hover:border-[#6A2630]/40'
                        }`}
                      >
                        Cash at Door
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-host-grotesk font-semibold text-xs text-[#6A2630] block mb-1">
                          Card Number <span className="text-poppy">*</span>
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="4242 4242 4242 4242"
                          value={cardDetails.cardNumber}
                          onChange={handleCardChange}
                          required={paymentMethod === 'card'}
                          className="w-full px-4 py-2 text-sm bg-white/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-host-grotesk font-semibold text-xs text-[#6A2630] block mb-1">
                            Expiry <span className="text-poppy">*</span>
                          </label>
                          <input
                            type="text"
                            name="expiry"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={handleCardChange}
                            required={paymentMethod === 'card'}
                            className="w-full px-4 py-2 text-sm bg-white/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                          />
                        </div>
                        <div>
                          <label className="font-host-grotesk font-semibold text-xs text-[#6A2630] block mb-1">
                            CVC <span className="text-poppy">*</span>
                          </label>
                          <input
                            type="text"
                            name="cvc"
                            placeholder="123"
                            value={cardDetails.cvc}
                            onChange={handleCardChange}
                            required={paymentMethod === 'card'}
                            className="w-full px-4 py-2 text-sm bg-white/50 border border-[#6A2630]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-[#6A2630]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#6A2630] hover:bg-[#6A2630]/90 text-plaster font-host-grotesk font-bold text-base py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : isPaidEvent ? `Pay ${getTicketPrice()}` : 'RSVP Now'}
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
        )}
      </div>
    </motion.div>
  )
}