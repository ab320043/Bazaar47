'use client'

import { motion } from 'framer-motion'
import { Send, CreditCard, Ticket, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { TourCity } from '@/data/tour-data'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

interface CityRSVPFormProps {
  city: TourCity
}

interface CityRSVPFormData {
  fullName: string
  email: string
  city: string
  instagram: string
  zipCode: string
  tickets: string
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Checkout form component
function CheckoutForm({ 
  city, 
  ticketCount, 
  onSuccess, 
  onError,
  formData,
  clientSecret,
}: { 
  city: TourCity, 
  ticketCount: number, 
  onSuccess: () => void, 
  onError: (message: string) => void,
  formData: CityRSVPFormData,
  clientSecret: string | null
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return

    setIsProcessing(true)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/tours/${city.id}`,
        },
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else {
        await fetch('/api/admin/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              ...formData,
              eventCity: city.city,
              eventDisplayName: city.city,
              venue: city.venue,
              date: city.date,
              eventId: city.id,
              userCity: formData.city,
              paymentStatus: 'paid',
              totalPrice: `$${ticketCount * 10}`,
            },
            type: 'rsvp',
          }),
        })
        onSuccess()
      }
    } catch (error) {
      onError('Something went wrong with payment')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!clientSecret) {
    return (
      <div className="bg-white/50 rounded-xl p-6 text-center">
        <p className="font-host-grotesk text-[#6A2630]/60">Loading payment...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
      <div className="bg-white/50 rounded-xl p-4 border border-[#6A2630]/10">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-[#6A2630]" />
          <span className="font-host-grotesk font-semibold text-sm text-[#6A2630]">
            Card Details
          </span>
        </div>
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#6A2630] hover:bg-[#6A2630]/90 text-plaster font-host-grotesk font-bold text-base py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay $${ticketCount * 10}`}
        <Lock className="w-4 h-4" />
      </button>
    </form>
  )
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
  const [paymentError, setPaymentError] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoadingPayment, setIsLoadingPayment] = useState(false)

  const isPaidEvent = city.id === 'south-florida'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const fetchPaymentIntent = async () => {
    if (!isPaidEvent || clientSecret) return
    
    setIsLoadingPayment(true)
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(formData.tickets || '1') * 10,
          city: city.city,
          email: formData.email || 'guest@bazaar47.com',
          fullName: formData.fullName || 'Guest',
        }),
      })
      
      const data = await response.json()
      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
      } else {
        setPaymentError(data.error || 'Failed to initialize payment')
      }
    } catch (error) {
      setPaymentError('Failed to initialize payment')
    } finally {
      setIsLoadingPayment(false)
    }
  }

  useEffect(() => {
    if (isPaidEvent && formData.email && formData.fullName) {
      const timer = window.setTimeout(() => {
        fetchPaymentIntent()
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [isPaidEvent, formData.email, formData.fullName, formData.tickets])

  const handleRSVPSuccess = () => {
    setIsSuccess(true)
    setFormData({ fullName: '', email: '', city: '', instagram: '', zipCode: '', tickets: '1' })
    setClientSecret(null)
  }

  const handlePaymentError = (message: string) => {
    setPaymentError(message)
    setTimeout(() => setPaymentError(''), 5000)
  }

  const getTicketPrice = () => {
    const qty = parseInt(formData.tickets || '1')
    return `$${qty * 10}`
  }

  const handleFreeRSVP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...formData,
            eventCity: city.city,
            eventDisplayName: city.city,
            venue: city.venue,
            date: city.date,
            eventId: city.id,
            userCity: formData.city,
          },
          type: 'rsvp',
        }),
      })
      if (response.ok) {
        setIsSuccess(true)
        setFormData({ fullName: '', email: '', city: '', instagram: '', zipCode: '', tickets: '1' })
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch (error) {
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
              onClick={() => {
                setIsSuccess(false)
                setClientSecret(null)
              }}
              className="mt-4 text-chartreuse font-bold text-sm hover:underline"
            >
              Submit another {isPaidEvent ? 'order' : 'RSVP'}
            </button>
          </div>
        ) : (
          <div suppressHydrationWarning>
            {/* Shared form fields */}
            <div className="space-y-4">
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
                  suppressHydrationWarning
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
                  suppressHydrationWarning
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
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="font-host-grotesk font-semibold text-sm text-[#6A2630] block mb-1">
                    Tickets <span className="text-poppy">*</span>
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
                    suppressHydrationWarning
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
                      suppressHydrationWarning
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
                    suppressHydrationWarning
                  />
                </div>
              </div>
            </div>

            {/* Payment or Free RSVP */}
            {isPaidEvent ? (
              <div className="space-y-3">
                {isLoadingPayment ? (
                  <div className="bg-white/50 rounded-xl p-6 text-center">
                    <p className="font-host-grotesk text-[#6A2630]/60">Loading payment...</p>
                  </div>
                ) : clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      city={city}
                      ticketCount={parseInt(formData.tickets || '1')}
                      onSuccess={handleRSVPSuccess}
                      onError={handlePaymentError}
                      formData={formData}
                      clientSecret={clientSecret}
                    />
                  </Elements>
                ) : (
                  <button
                    onClick={fetchPaymentIntent}
                    className="w-full bg-[#6A2630] hover:bg-[#6A2630]/90 text-plaster font-host-grotesk font-bold text-base py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    Proceed to Payment
                    <CreditCard className="w-4 h-4" />
                  </button>
                )}
                {paymentError && (
                  <p className="text-poppy text-sm font-host-grotesk text-center">{paymentError}</p>
                )}
              </div>
            ) : (
              <button
                onClick={handleFreeRSVP}
                disabled={isSubmitting}
                className="w-full bg-[#6A2630] hover:bg-[#6A2630]/90 text-plaster font-host-grotesk font-bold text-base py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'RSVP Now'}
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}