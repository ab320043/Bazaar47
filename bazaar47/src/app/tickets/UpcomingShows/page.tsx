// app/tickets/UpcomingShows/page.tsx (updated handleSubmit section)
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, CreditCard, Ticket, Calendar, MapPin, Clock, Lock, Sparkles, Users } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import overlay from '@/assets/newAssets/overlay.png'
import { EventConfig, getDefaultEvent, getEventById } from './events'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface TicketFormData {
  fullName: string
  email: string
  phone: string
  tickets: string
}

// Checkout Form Component
function CheckoutForm({
  onSuccess,
  onError,
  formData,
  event,
  city,
}: {
  onSuccess: () => void
  onError: (message: string) => void
  formData: TicketFormData
  event: EventConfig
  city: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    if (!stripe || !elements) {
      console.error('❌ Stripe not initialized')
      return
    }

    setIsProcessing(true)
    console.log('💳 Starting payment processing...')

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        console.error('❌ Elements submit error:', submitError)
        onError(submitError.message || 'Validation failed')
        setIsProcessing(false)
        return
      }

      console.log('💳 Confirming payment with Stripe...')
      
      // Store order data in sessionStorage before redirect
      const orderData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        tickets: formData.tickets,
        city: city,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: `${event.location}, ${event.city}, ${event.state}`,
        total: parseInt(formData.tickets) * event.price,
        timestamp: new Date().toISOString(),
      }
      
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData))
      console.log('💾 Order data saved to sessionStorage')

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/tickets/UpcomingShows?success=true&event=${event.id}`,
        },
      })

      if (error) {
        console.error('❌ Payment error:', error)
        sessionStorage.removeItem('pendingOrder')
        onError(error.message || 'Payment failed')
      }
    } catch (error) {
      console.error('❌ Payment processing error:', error)
      onError('Something went wrong with payment')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/50 rounded-xl p-4 border border-rosewood/10">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-rosewood" />
          <span className="font-host-grotesk font-semibold text-sm text-rosewood">
            Card Details
          </span>
        </div>
        <PaymentElement />
      </div>

      <button
        type="button"
        onClick={handlePayment}
        disabled={!stripe || isProcessing}
        className="w-full bg-rosewood hover:bg-chartreuse text-plaster hover:text-grove font-host-grotesk font-bold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
      >
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <span className="relative z-10">
          {isProcessing ? 'Processing...' : `Pay $${parseInt(formData.tickets) * event.price}`}
        </span>
        <Lock className="w-4 h-4 relative z-10" />
      </button>
    </div>
  )
}

export default function UpcomingShowsPage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event')
  const successParam = searchParams.get('success')
  
  // Use useMemo instead of useState + useEffect
  const selectedEvent = useMemo(() => {
    if (eventId) {
      return getEventById(eventId) || getDefaultEvent()
    }
    return getDefaultEvent()
  }, [eventId])
  
  const [formData, setFormData] = useState<TicketFormData>({
    fullName: '',
    email: '',
    phone: '',
    tickets: '1',
  })
  
  // City is managed separately since it's not part of TicketFormData
  const [city, setCity] = useState('')
  
  const [isSuccess, setIsSuccess] = useState(successParam === 'true')
  const [paymentError, setPaymentError] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoadingPayment, setIsLoadingPayment] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  // Check if event is free
  const isFreeEvent = selectedEvent.price === 0

  // Process pending order when returning from Stripe payment
  useEffect(() => {
    const processPendingOrder = async () => {
      const pendingOrderData = sessionStorage.getItem('pendingOrder')
      
      if (pendingOrderData && successParam === 'true') {
        console.log('📦 Found pending order, processing...')
        
        try {
          const orderData = JSON.parse(pendingOrderData)
          console.log('📋 Order data:', orderData)
          
          const orderNumber = `BZR-${Date.now().toString(36).toUpperCase()}`
          
          // Save to admin
          console.log('📊 Saving to admin...')
          const adminResponse = await fetch('/api/admin/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: {
                fullName: orderData.fullName,
                email: orderData.email,
                phone: orderData.phone,
                tickets: orderData.tickets,
                city: orderData.city,
                eventId: orderData.eventId,
                eventName: orderData.eventName,
                eventDate: orderData.eventDate,
                eventTime: orderData.eventTime,
                eventLocation: orderData.eventLocation,
                orderNumber,
                pricePaid: `$${orderData.total}`,
                ticketCount: parseInt(orderData.tickets),
                paymentStatus: 'paid',
                timestamp: orderData.timestamp,
              },
              type: 'ticket',
            }),
          })
          console.log('  Admin save response:', adminResponse.status)

          // Send email
          console.log('📧 Sending confirmation email to:', orderData.email)
          const emailResponse = await fetch('/api/send-ticket-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: orderData.fullName,
              email: orderData.email,
              ticketCount: parseInt(orderData.tickets),
              totalPrice: `$${orderData.total}`,
              eventName: orderData.eventName,
              eventDate: orderData.eventDate,
              eventTime: orderData.eventTime,
              eventLocation: orderData.eventLocation,
              orderNumber,
              paymentMethod: 'Credit Card',
            }),
          })

          const emailResult = await emailResponse.json()
          console.log('📧 Email API response:', emailResult)

          if (emailResponse.ok) {
            console.log('✅ Order processed and email sent successfully!')
          } else {
            console.error('❌ Email sending failed:', emailResult)
          }

          // Clear the pending order
          sessionStorage.removeItem('pendingOrder')
          console.log('🗑️ Pending order cleared from sessionStorage')
          
        } catch (error) {
          console.error('❌ Failed to process pending order:', error)
        }
      }
    }

    if (successParam === 'true') {
      processPendingOrder()
    }
  }, [successParam])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'city') {
      setCity(value)
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const fetchPaymentIntent = async () => {
    setIsLoadingPayment(true)
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(formData.tickets) * selectedEvent.price,
          city: city || selectedEvent.city,
          email: formData.email,
          fullName: formData.fullName,
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
        }),
      })

      const data = await response.json()
      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
        setShowPayment(true)
      } else {
        setPaymentError(data.error || 'Failed to initialize payment')
      }
    } catch (error) {
      setPaymentError('Failed to initialize payment')
    } finally {
      setIsLoadingPayment(false)
    }
  }

  const handleSuccess = () => {
    setIsSuccess(true)
    setFormData({ fullName: '', email: '', phone: '', tickets: '1' })
    setCity('')
    setClientSecret(null)
    setShowPayment(false)
  }

  const handleError = (message: string) => {
    setPaymentError(message)
    setTimeout(() => setPaymentError(''), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If it's a free event, handle RSVP directly
    if (isFreeEvent) {
      setIsLoadingPayment(true)
      
      try {
        const orderNumber = `RSVP-${Date.now().toString(36).toUpperCase()}`
        
        const orderData = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          tickets: formData.tickets,
          city: city || selectedEvent.city,
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
          eventDate: selectedEvent.date,
          eventTime: selectedEvent.time,
          eventLocation: `${selectedEvent.location}, ${selectedEvent.city}, ${selectedEvent.state}`,
          total: 0,
          timestamp: new Date().toISOString(),
        }
        
        // Save RSVP to admin
        console.log('📊 Saving RSVP to admin...')
        const adminResponse = await fetch('/api/admin/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              fullName: orderData.fullName,
              email: orderData.email,
              phone: orderData.phone,
              tickets: orderData.tickets,
              city: orderData.city,
              eventId: orderData.eventId,
              eventName: orderData.eventName,
              eventDate: orderData.eventDate,
              eventTime: orderData.eventTime,
              eventLocation: orderData.eventLocation,
              orderNumber,
              pricePaid: '$0 (Free RSVP)',
              ticketCount: parseInt(orderData.tickets),
              paymentStatus: 'free',
              timestamp: orderData.timestamp,
            },
            type: 'rsvp',
          }),
        })
        console.log('  Admin save response:', adminResponse.status)
        
        // 📧 Send RSVP confirmation email
        console.log('📧 Sending RSVP confirmation email to:', orderData.email)
        const emailResponse = await fetch('/api/send-ticket-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: orderData.fullName,
            email: orderData.email,
            ticketCount: parseInt(orderData.tickets),
            totalPrice: '$0 (Free RSVP)',
            eventName: orderData.eventName,
            eventDate: orderData.eventDate,
            eventTime: orderData.eventTime,
            eventLocation: orderData.eventLocation,
            orderNumber,
            paymentMethod: 'Free RSVP',
          }),
        })

        const emailResult = await emailResponse.json()
        console.log('📧 Email API response:', emailResult)

        if (emailResponse.ok) {
          console.log('✅ RSVP confirmed and email sent successfully!')
        } else {
          console.error('❌ Email sending failed:', emailResult)
        }
        
        handleSuccess()
      } catch (error) {
        console.error('❌ Failed to save RSVP:', error)
        setPaymentError('Failed to save RSVP')
      } finally {
        setIsLoadingPayment(false)
      }
      return
    }
    
    if (!showPayment) {
      await fetchPaymentIntent()
    }
  }

  const totalPrice = parseInt(formData.tickets || '1') * selectedEvent.price

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-plaster">
      
      {/* Background with overlay */}
      <div className="absolute inset-0 opacity-20">
        <Image
          src={overlay}
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Back buttons */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20 flex flex-col sm:flex-row gap-2">
        {/* <Link 
          href="/"
          className="inline-flex items-center gap-2 text-rosewood/60 hover:text-rosewood transition-colors font-host-grotesk text-sm group bg-plaster/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-rosewood/10"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link> */}
        <Link 
          href="/#events"
          scroll={true}
          className="inline-flex items-center gap-2 text-rosewood/60 hover:text-rosewood transition-colors font-host-grotesk text-sm group bg-plaster/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-rosewood/10"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </Link>
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 min-h-screen flex items-center justify-center py-20">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-12 h-px bg-rosewood/30" />
              <span className="font-host-grotesk text-xs text-rosewood/60 uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                <Ticket className="w-3 h-3" />
                {isFreeEvent ? 'RSVP' : 'Upcoming Shows'}
                <Ticket className="w-3 h-3" />
              </span>
              <span className="w-12 h-px bg-rosewood/30" />
            </div>
            <h1 className="font-host-grotesk-narrow font-bold text-4xl md:text-5xl lg:text-6xl text-rosewood leading-tight">
              {isFreeEvent ? 'RSVP Now' : 'Get Your Tickets'}
            </h1>
            <p className="font-host-grotesk text-lg text-rosewood/50 mt-3">
              {selectedEvent.description}
            </p>
          </div>

          {/* Event Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative bg-rosewood/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-rosewood/10 mb-8 overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-chartreuse/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-hippie/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-rosewood" />
                <h3 className="font-host-grotesk font-bold text-rosewood text-lg">
                  {selectedEvent.name}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-4 bg-plaster/20 rounded-xl border border-rosewood/5 hover:bg-plaster/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-chartreuse/20 flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5 text-rosewood" />
                  </div>
                  <span className="font-host-grotesk text-xs text-rosewood/50 uppercase tracking-wider">Date</span>
                  <span className="font-host-grotesk font-bold text-rosewood text-base mt-1">{selectedEvent.date}</span>
                </div>
                
                <div className="flex flex-col items-center p-4 bg-plaster/20 rounded-xl border border-rosewood/5 hover:bg-plaster/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-chartreuse/20 flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5 text-rosewood" />
                  </div>
                  <span className="font-host-grotesk text-xs text-rosewood/50 uppercase tracking-wider">Time</span>
                  <span className="font-host-grotesk font-bold text-rosewood text-base mt-1">{selectedEvent.time}</span>
                </div>
                
                <div className="flex flex-col items-center p-4 bg-plaster/20 rounded-xl border border-rosewood/5 hover:bg-plaster/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-chartreuse/20 flex items-center justify-center mb-3">
                    <MapPin className="w-5 h-5 text-rosewood" />
                  </div>
                  <span className="font-host-grotesk text-xs text-rosewood/50 uppercase tracking-wider">Location</span>
                  <span className="font-host-grotesk font-bold text-rosewood text-base mt-1">{selectedEvent.location}</span>
                  <span className="font-host-grotesk text-xs text-rosewood/30 mt-0.5">{selectedEvent.city}, {selectedEvent.state}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pricing Info - Show different for free events */}
          {!isFreeEvent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-rosewood/5 border border-rosewood/10 rounded-2xl p-4 md:p-5 mb-8 text-center"
            >
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <span className="font-host-grotesk text-sm text-rosewood/60">
                  🎟️ Presale: <span className="font-bold text-rosewood">${selectedEvent.price}</span>
                </span>
                <span className="w-px h-6 bg-rosewood/10 hidden sm:block" />
                <span className="font-host-grotesk text-sm text-rosewood/60">
                  💵 At the Door: <span className="font-bold text-rosewood">${selectedEvent.doorPrice}</span>
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-chartreuse/20 border-2 border-chartreuse/30 rounded-2xl p-4 md:p-5 mb-8 text-center"
            >
              <span className="font-host-grotesk font-bold text-henna text-lg flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                🎉 This is a FREE event! RSVP now to secure your spot.
              </span>
            </motion.div>
          )}

          {/* Ticket/RSVP Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-rosewood/5 shadow-xl overflow-hidden"
          >
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-chartreuse/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-rosewood" />
                <h3 className="font-host-grotesk font-bold text-xl text-rosewood">
                  {isFreeEvent ? 'RSVP' : 'Book Tickets'}
                </h3>
                <span className="ml-auto font-host-grotesk text-xs text-rosewood/30">
                  {isFreeEvent ? 'Secure your spot' : 'Secure your spot'}
                </span>
              </div>

              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="bg-chartreuse/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-chartreuse" />
                  </div>
                  <h2 className="font-host-grotesk font-bold text-2xl text-rosewood">
                    {isFreeEvent ? 'RSVP Confirmed! 🎉' : 'Tickets Confirmed! 🎉'}
                  </h2>
                  <p className="font-host-grotesk text-rosewood/60 mt-2">
                    {isFreeEvent ? 'See you at the Block Party!' : 'Check your email for the confirmation.'}
                  </p>
                  <p className="font-host-grotesk text-xs text-rosewood/30 mt-4">
                    {isFreeEvent ? 'Excited to see you at ' : 'Excited to see you at '}{selectedEvent.name}!
                  </p>
                  <Link
                    href="/#events"
                    scroll={true}
                    className="mt-6 inline-block text-chartreuse font-bold text-sm hover:underline transition-colors"
                  >
                    ← Back to Events
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                      Full Name <span className="text-poppy">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      disabled={showPayment}
                      className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood placeholder:text-rosewood/30 transition-all duration-200 hover:border-rosewood/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Email <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={showPayment}
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood placeholder:text-rosewood/30 transition-all duration-200 hover:border-rosewood/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        Phone <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        disabled={showPayment}
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood placeholder:text-rosewood/30 transition-all duration-200 hover:border-rosewood/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="(352) 123-4567"
                      />
                    </div>
                  </div>

                  {/* City & Tickets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        City <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={city}
                        onChange={handleChange}
                        required
                        disabled={showPayment}
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood placeholder:text-rosewood/30 transition-all duration-200 hover:border-rosewood/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder={`e.g. ${selectedEvent.city}, ${selectedEvent.state}`}
                      />
                    </div>
                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                        {isFreeEvent ? 'Guests' : 'Tickets'} <span className="text-poppy">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(formData.tickets) || 1
                            if (val > 1) setFormData({ ...formData, tickets: String(val - 1) })
                          }}
                          disabled={showPayment}
                          className="w-10 h-10 rounded-xl bg-plaster/50 hover:bg-plaster/80 text-rosewood transition-colors flex items-center justify-center border border-rosewood/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          name="tickets"
                          min="1"
                          max="10"
                          value={formData.tickets}
                          onChange={handleChange}
                          required
                          disabled={showPayment}
                          className="w-16 text-center px-2 py-3 bg-plaster/50 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(formData.tickets) || 1
                            if (val < 10) setFormData({ ...formData, tickets: String(val + 1) })
                          }}
                          disabled={showPayment}
                          className="w-10 h-10 rounded-xl bg-plaster/50 hover:bg-plaster/80 text-rosewood transition-colors flex items-center justify-center border border-rosewood/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Section - Only show for paid events */}
                  {!isFreeEvent && (
                    <>
                      {!showPayment ? (
                        <button
                          type="submit"
                          disabled={isLoadingPayment}
                          className="w-full bg-rosewood hover:bg-chartreuse text-plaster hover:text-grove font-host-grotesk font-bold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingPayment ? 'Loading...' : `Proceed to Payment — $${totalPrice}`}
                          <CreditCard className="w-4 h-4" />
                        </button>
                      ) : clientSecret ? (
                        <div className="space-y-4">
                          <Elements 
                            stripe={stripePromise} 
                            options={{
                              clientSecret,
                              appearance: {
                                theme: 'stripe' as const,
                              },
                            }}
                            key={clientSecret}
                          >
                            <CheckoutForm
                              onSuccess={handleSuccess}
                              onError={handleError}
                              formData={formData}
                              event={selectedEvent}
                              city={city}
                            />
                          </Elements>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPayment(false)
                              setClientSecret(null)
                            }}
                            className="w-full text-rosewood/60 hover:text-rosewood font-host-grotesk text-sm transition-colors"
                          >
                            ← Back to edit details
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}

                  {/* Free Event RSVP Button */}
                  {isFreeEvent && (
                    <button
                      type="submit"
                      disabled={isLoadingPayment}
                      className="w-full bg-chartreuse hover:bg-plaster text-henna hover:text-henna font-host-grotesk font-bold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      <Users className="w-5 h-5" />
                      {isLoadingPayment ? 'Submitting...' : 'RSVP Free'}
                    </button>
                  )}
                  
                  {paymentError && (
                    <p className="text-poppy text-sm font-host-grotesk text-center">{paymentError}</p>
                  )}
                </form>
              )}
            </div>
          </motion.div>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center font-host-grotesk text-xs text-rosewood/20 mt-8"
          >
            {isFreeEvent ? '✦ Free RSVP · Limited capacity ✦' : '✦ Secure payment powered by Stripe ✦'}
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}