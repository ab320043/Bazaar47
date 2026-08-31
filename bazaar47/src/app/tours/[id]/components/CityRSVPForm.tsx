'use client'

import { motion } from 'framer-motion'
import { Send, CreditCard, Ticket, Lock, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// ✅ Import from events.ts instead of tour-data.ts
import { getEventBySlug, type EventDefinition } from '@/data/events'

interface CityRSVPFormProps {
  city: EventDefinition
}

interface CityRSVPFormData {
  fullName: string
  email: string
  city: string
  instagram: string
  zipCode: string
  tickets: string
}

// 💲 Price per ticket — single source of truth
const PRICE_PER_TICKET = 5

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Basic email format check — used to gate payment-intent creation
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

// ✅ Function to send confirmation email
const sendConfirmationEmail = async (data: {
  name: string
  email: string
  ticketCount: number
  totalPrice: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  orderNumber: string
}) => {
  try {
    const response = await fetch('/api/send-ticket-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      console.error('Failed to send email:', await response.text())
      return false
    }
    
    console.log('✅ Email sent successfully!')
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Checkout form component
function CheckoutForm({ 
  city, 
  ticketCount, 
  onSuccess, 
  onError,
  formData,
  clientSecret,
}: { 
  city: EventDefinition, 
  ticketCount: number, 
  onSuccess: () => void, 
  onError: (message: string) => void,
  formData: CityRSVPFormData,
  clientSecret: string | null
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return

    setIsProcessing(true)

    try {
      // ✅ elements.submit() must run before confirmPayment()
      const { error: submitError } = await elements.submit()
      if (submitError) {
        onError(submitError.message || 'Please check your payment details')
        setIsProcessing(false)
        return
      }

      // ✅ Generate order number FIRST
      const orderNum = `TICKET-${Date.now().toString().slice(-8)}`
      setOrderNumber(orderNum)
      const totalAmount = ticketCount * PRICE_PER_TICKET
      
      // ✅ Send confirmation email BEFORE confirming payment
      const emailSent = await sendConfirmationEmail({
        name: formData.fullName || 'Guest',
        email: formData.email,
        ticketCount: ticketCount,
        totalPrice: `$${totalAmount}.00`,
        eventName: city.name || 'Bazaar47 Event',
        eventDate: city.date || 'TBA',
        eventTime: city.time || 'TBA',
        eventLocation: city.location || 'TBA',
        orderNumber: orderNum,
        
      })

      if (!emailSent) {
        console.warn('⚠️ Email may not have been sent, but continuing with payment')
      }

      // ✅ Save submission to database
      await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...formData,
            tickets: ticketCount,
            eventCity: city.city || city.name,
            eventDisplayName: city.name,
            venue: city.location,
            date: city.date,
            eventId: city.id,
            eventSlug: city.slug,
            paymentStatus: 'paid',
            totalPrice: `$${totalAmount}`,
            orderNumber: orderNum,
          },
          type: 'rsvp',
        }),
      })

      // ✅ Show confirmation message before redirect
      setShowConfirmation(true)
      
      // ✅ Wait 2 seconds so user can see the confirmation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // ✅ NOW confirm the payment (this will redirect)
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/tours/${city.slug}?payment_success=true`,
        },
      })

      if (error) {
        onError(error.message || 'Payment failed')
        setIsProcessing(false)
        setShowConfirmation(false)
        return
      }

      // Note: The redirect happens here, so onSuccess won't be called
      // But the email was already sent, so it's fine!
      
      // If we reach here without redirect (unlikely), call onSuccess
      onSuccess()
    } catch (error) {
      console.error('Payment error:', error)
      onError('Something went wrong with payment')
      setIsProcessing(false)
      setShowConfirmation(false)
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
    <>
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
          {isProcessing ? 'Processing...' : `Pay $${ticketCount * PRICE_PER_TICKET}`}
          <Lock className="w-4 h-4" />
        </button>
      </form>

      {/* ✅ Confirmation Overlay */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-plaster rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-chartreuse/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-chartreuse" />
              </div>
              <h3 className="font-host-grotesk font-bold text-2xl text-[#341B1C] mb-2">
                Booking Confirmed! 🎉
              </h3>
              <p className="font-host-grotesk text-[#6A2630] mb-2">
                Your tickets for <span className="font-bold">{city.name}</span> have been confirmed.
              </p>
              <div className="bg-white/50 rounded-xl p-4 my-4">
                <p className="font-host-grotesk text-sm text-[#6A2630]">
                  Order #{orderNumber}
                </p>
                <p className="font-host-grotesk text-xs text-[#6A2630]/60 mt-1">
                  A confirmation email has been sent to {formData.email}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-[#6A2630]/60">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-chartreuse border-t-transparent"></div>
                <span>Redirecting to payment...</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  // ✅ Check if this is a paid event (South Florida is the only paid one)
  const isPaidEvent = city.slug === 'south-florida'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === 'tickets') {
      if (value !== '') {
        const num = parseInt(value, 10)
        if (!Number.isInteger(num) || num < 1 || num > 10) return
      }
      if (clientSecret) setClientSecret(null)
    }

    // Any edit to email/name after a client secret was created should
    // invalidate it, since the intent was created with the old values.
    if ((name === 'email' || name === 'fullName') && clientSecret) {
      setClientSecret(null)
    }

    setFormData({ ...formData, [name]: value })
  }

  const fetchPaymentIntent = async () => {
    if (!isPaidEvent || clientSecret) return
    
    setIsLoadingPayment(true)
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(formData.tickets || '1') * PRICE_PER_TICKET,
          city: city.city || city.name,
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
    if (
      isPaidEvent &&
      formData.fullName.trim() &&
      isValidEmail(formData.email)
    ) {
      const timer = window.setTimeout(() => {
        fetchPaymentIntent()
      }, 800)
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

  const handleFreeRSVP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.city.trim() || !formData.zipCode.trim()) {
      alert('Please fill in all required fields.')
      return
    }
    const ticketNum = parseInt(formData.tickets, 10)
    if (!Number.isInteger(ticketNum) || ticketNum < 1 || ticketNum > 10) {
      alert('Tickets must be a whole number between 1 and 10.')
      return
    }

    setIsSubmitting(true)
    
    // ✅ Generate order number for RSVP
    const orderNum = `RSVP-${Date.now().toString().slice(-8)}`
    setOrderNumber(orderNum)
    
    try {
      // ✅ Send confirmation email FIRST for free RSVP
      const emailSent = await sendConfirmationEmail({
        name: formData.fullName || 'Guest',
        email: formData.email,
        ticketCount: ticketNum,
        totalPrice: '$0 (Free RSVP)',
        eventName: city.name || 'Bazaar47 Event',
        eventDate: city.date || 'TBA',
        eventTime: city.time || 'TBA',
        eventLocation: city.location || 'TBA',
        orderNumber: orderNum,
      })

      if (!emailSent) {
        console.warn('⚠️ Email may not have been sent, but continuing with RSVP')
      }

      // ✅ Use the new submissions endpoint
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...formData,
            tickets: ticketNum,
            eventCity: city.city || city.name,
            eventDisplayName: city.name,
            venue: city.location,
            date: city.date,
            eventId: city.id,
            eventSlug: city.slug,
            orderNumber: orderNum,
          },
          type: 'rsvp',
        }),
      })
      
      if (response.ok) {
        // ✅ Show confirmation for free RSVP
        setShowConfirmation(true)
        
        // ✅ Wait 2 seconds then show success
        await new Promise(resolve => setTimeout(resolve, 2000))
        setShowConfirmation(false)
        setIsSuccess(true)
        setFormData({ fullName: '', email: '', city: '', instagram: '', zipCode: '', tickets: '1' })
      } else {
        const err = await response.json().catch(() => null)
        alert(err?.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('RSVP error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ Get display name
  const displayName = city.city || city.name

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
            {isPaidEvent ? 'Buy Tickets' : 'RSVP'} for {displayName}
          </h2>
          {isPaidEvent && (
            <span className="text-sm font-host-grotesk font-bold text-chartreuse bg-chartreuse/10 px-3 py-1 rounded-full">
              ${parseInt(formData.tickets || '1') * PRICE_PER_TICKET}
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
                ? `Your tickets for ${displayName} have been confirmed! Check your email for details.`
                : `We'll see you at ${displayName}! Check your email for details.`
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
            {/* Form fields */}
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

              <div className="grid grid-cols-1 gap-4">
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
              <div className="space-y-3 pt-8">
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
                    onClick={() => {
                      if (!formData.fullName.trim() || !isValidEmail(formData.email)) {
                        setPaymentError('Please enter a valid name and email first.')
                        setTimeout(() => setPaymentError(''), 5000)
                        return
                      }
                      fetchPaymentIntent()
                    }}
                    className="w-full bg-[#341B1C] hover:bg-[#CCD145] text-plaster hover:text-grove font-host-grotesk font-bold text-base py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
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
              <div className="pt-8">
                <button
                  onClick={handleFreeRSVP}
                  disabled={isSubmitting}
                  className="w-full bg-[#341B1C] hover:bg-[#CCD145] text-plaster hover:text-grove font-host-grotesk font-bold text-base py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'RSVP Now'}
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ✅ Confirmation Overlay for Free RSVP */}
        {showConfirmation && !isPaidEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-plaster rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-chartreuse/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-chartreuse" />
                </div>
                <h3 className="font-host-grotesk font-bold text-2xl text-[#341B1C] mb-2">
                  RSVP Confirmed! 🎉
                </h3>
                <p className="font-host-grotesk text-[#6A2630] mb-2">
                  You are all set for <span className="font-bold">{city.name}</span>!
                </p>
                <div className="bg-white/50 rounded-xl p-4 my-4">
                  <p className="font-host-grotesk text-sm text-[#6A2630]">
                    RSVP #{orderNumber}
                  </p>
                  <p className="font-host-grotesk text-xs text-[#6A2630]/60 mt-1">
                    A confirmation email has been sent to {formData.email}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-[#6A2630]/60">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-chartreuse border-t-transparent"></div>
                  <span>Finalizing your RSVP...</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  )
}