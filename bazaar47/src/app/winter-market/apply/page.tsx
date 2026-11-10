// app/winter-market/apply/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Lock,
  Sparkles,
  MapPin,
  Clock,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import overlay from '@/assets/newAssets/overlay.png'
import {
  VENDOR_FEE_PER_DAY,
  MAX_VENDORS_PER_DAY,
  VENUE_NAME,
} from '@/data/winter-market'
import type { WinterMarketAvailability } from '@/types/winter-market'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ============================================
// HELPERS
// ============================================

function formatDayLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    full: d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
  }
}

// ============================================
// INNER FORM (Stripe Elements)
// ============================================

function CheckoutForm({
  clientSecret,
  totalAmount,
  onSuccess,
  onError,
}: {
  clientSecret: string
  totalAmount: number
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePay = async () => {
    if (!stripe || !elements) return
    setIsProcessing(true)
    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        onError(submitError.message || 'Validation failed')
        return
      }
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/winter-market/apply?success=true`,
        },
      })
      if (error) {
        onError(error.message || 'Payment failed')
      } else {
        onSuccess()
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-grove rounded-2xl border border-chartreuse/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-chartreuse/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-chartreuse" />
          <span className="font-host-grotesk font-bold text-plaster text-lg">
            Secure Checkout
          </span>
        </div>
        
        {/* Stripe Elements container needs a light background to look right */}
        <div className="bg-white rounded-xl p-4 mb-5">
          <PaymentElement />
        </div>

        <button
          type="button"
          onClick={handlePay}
          disabled={!stripe || isProcessing}
          className="w-full bg-chartreuse hover:bg-plaster text-grove hover:text-rosewood font-host-grotesk font-bold text-base py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ShieldCheck className="w-5 h-5" />
          )}
          {isProcessing ? 'Processing...' : `Pay $${totalAmount}.00`}
        </button>
        
        <p className="font-host-grotesk text-xs text-plaster/50 text-center mt-3">
          Payments are securely processed by Stripe.
        </p>
      </div>
    </div>
  )
}

// ============================================
// PAGE
// ============================================

export default function WinterMarketApplyPage() {
  const [availability, setAvailability] = useState<WinterMarketAvailability[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(true)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    instagram: '',
    businessName: '',
    products: '',
    needsTable: false,
    needsTent: false,
    needsElectricity: false,
    needsExtensionCord: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/winter-market/availability')
      .then((r) => r.json())
      .then((d) => setAvailability(d.availability || []))
      .catch(() => setError('Failed to load availability'))
      .finally(() => setLoadingAvailability(false))
  }, [])

  const availabilityByDate = useMemo(() => {
    const map = new Map<string, WinterMarketAvailability>()
    for (const a of availability) map.set(a.date, a)
    return map
  }, [availability])

  const totalAmount = selectedDates.length * VENDOR_FEE_PER_DAY

  const toggleDate = (iso: string) => {
    const a = availabilityByDate.get(iso)
    if (a?.isFull) return
    setSelectedDates((prev) =>
      prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]
    )
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (selectedDates.length === 0) {
      setError('Please select at least one date.')
      return
    }
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.businessName.trim() || !form.products.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/winter-market/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          selectedDates,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create application')
        return
      }
      setClientSecret(data.clientSecret)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-plaster pb-20">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <Image src={overlay} alt="" fill className="object-cover" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16 max-w-3xl">
        <Link
          href="/winter-market"
          className="inline-flex items-center gap-2 text-rosewood/60 hover:text-rosewood font-host-grotesk text-sm mb-8 group bg-white px-4 py-2 rounded-full shadow-sm border border-rosewood/5 w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Market
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-8 h-px bg-henna/30" />
            <span className="font-host-grotesk text-[10px] sm:text-xs text-henna uppercase tracking-[0.3em] font-bold flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Vendor Application
            </span>
            <span className="w-8 h-px bg-henna/30" />
          </div>
          <h1 className="font-host-grotesk-narrow font-black text-4xl md:text-5xl lg:text-6xl text-rosewood leading-[0.95]">
            Apply to Vend
          </h1>
          <p className="font-host-grotesk text-rosewood/60 mt-3 max-w-md mx-auto">
            Select your dates, tell us about your booth, and secure your spot for the Downtown Winter Market Series.
          </p>
          <p className="font-host-grotesk text-rosewood/60 mt-3 max-w-md mx-auto">
            Feel free to sign up for multiple markets throughout the season.
          </p>
        </div>

        {/* Success State */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 border-2 border-chartreuse shadow-xl text-center"
            >
              <div className="w-20 h-20 bg-chartreuse/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-cypress" />
              </div>
              <h2 className="font-host-grotesk-narrow font-black text-3xl text-rosewood">
                You&apos;re in!
              </h2>
              <p className="font-host-grotesk text-rosewood/60 mt-3 max-w-sm mx-auto">
                Payment received. A confirmation email with your booth details is on its way. See you at The Streatery!
              </p>
              <Link
                href="/winter-market"
                className="mt-8 inline-flex items-center gap-2 bg-rosewood hover:bg-chartreuse text-plaster hover:text-grove px-8 py-3 rounded-xl font-host-grotesk font-bold transition-all"
              >
                Back to Market
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ============================================
                STEP 1: CALENDAR
                ============================================ */}
            <div className="bg-white rounded-3xl border-2 border-henna/10 shadow-sm overflow-hidden">
              <div className="bg-henna text-plaster p-5 sm:p-6 flex items-start gap-3">
                <div className="bg-plaster/20 p-2 rounded-xl mt-0.5">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-host-grotesk font-bold text-xl">
                    1. Select Your Dates
                  </h2>
                  <p className="font-host-grotesk text-sm text-plaster/80 mt-1">
                    Each night is limited to {MAX_VENDORS_PER_DAY} vendors. Fee is ${VENDOR_FEE_PER_DAY}/night.
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-[#FFFCF8]">
                {loadingAvailability ? (
                  <div className="text-center py-8 text-henna/40">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {availability.map((a) => {
                      const { weekday, date } = formatDayLabel(a.date)
                      const isSelected = selectedDates.includes(a.date)
                      const disabled = a.isFull
                      return (
                        <button
                          key={a.date}
                          type="button"
                          onClick={() => toggleDate(a.date)}
                          disabled={disabled}
                          className={`relative text-left p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 overflow-hidden group ${
                            disabled
                              ? 'border-rosewood/10 bg-rosewood/5 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'border-chartreuse bg-chartreuse shadow-md scale-[1.02]'
                              : 'border-rosewood/10 bg-white hover:border-henna/40 hover:bg-henna/5'
                          }`}
                        >
                          {/* Selected Checkmark */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-grove text-chartreuse rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}

                          <p className={`font-host-grotesk text-[10px] uppercase tracking-wider font-bold ${isSelected ? 'text-grove/70' : 'text-rosewood/50'}`}>
                            {weekday}
                          </p>
                          <p className={`font-host-grotesk font-black text-lg ${isSelected ? 'text-grove' : 'text-rosewood'}`}>
                            {date}
                          </p>
                          
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${disabled ? 'bg-poppy' : isSelected ? 'bg-grove' : 'bg-chartreuse'}`} />
                            <p className={`font-host-grotesk text-[11px] font-semibold ${isSelected ? 'text-grove/80' : disabled ? 'text-poppy' : 'text-rosewood/60'}`}>
                              {disabled ? 'Sold Out' : `${a.spotsRemaining} spots left`}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Running Total Footer inside the Calendar Card */}
              <div className="bg-henna/5 border-t border-henna/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="bg-henna/10 p-2 rounded-lg">
                    <MapPin className="w-4 h-4 text-henna" />
                  </div>
                  <div>
                    <p className="font-host-grotesk font-bold text-sm text-rosewood">{VENUE_NAME}</p>
                    <p className="font-host-grotesk text-xs text-rosewood/60">106 SW 1st Ave, Gainesville, FL</p>
                  </div>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-henna/20 shadow-sm flex items-center gap-3 w-full sm:w-auto justify-between">
                  <span className="font-host-grotesk text-sm font-semibold text-rosewood/60">
                    {selectedDates.length} night{selectedDates.length === 1 ? '' : 's'}
                  </span>
                  <span className="font-host-grotesk font-black text-henna text-lg">
                    ${totalAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================
                STEP 2: FORM DETAILS
                ============================================ */}
            <div className="bg-white rounded-3xl border-2 border-cypress/10 shadow-sm overflow-hidden">
              <div className="bg-cypress text-plaster p-5 sm:p-6 flex items-start gap-3">
                <div className="bg-plaster/20 p-2 rounded-xl mt-0.5">
                  <Sparkles className="w-5 h-5 text-chartreuse" />
                </div>
                <div>
                  <h2 className="font-host-grotesk font-bold text-xl">
                    2. Your Booth Details
                  </h2>
                  <p className="font-host-grotesk text-sm text-plaster/80 mt-1">
                    Tell us who you are and what you&apos;re bringing.
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="font-host-grotesk font-bold text-xs uppercase tracking-wider text-cypress/80 block mb-1.5">
                      Full Name <span className="text-poppy">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-plaster/30 border-2 border-transparent hover:border-cypress/20 focus:border-chartreuse focus:bg-white rounded-xl focus:outline-none font-host-grotesk text-rosewood transition-all"
                    />
                  </div>
                  <div>
                    <label className="font-host-grotesk font-bold text-xs uppercase tracking-wider text-cypress/80 block mb-1.5">
                      Email <span className="text-poppy">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-plaster/30 border-2 border-transparent hover:border-cypress/20 focus:border-chartreuse focus:bg-white rounded-xl focus:outline-none font-host-grotesk text-rosewood transition-all"
                    />
                  </div>
                  <div>
                    <label className="font-host-grotesk font-bold text-xs uppercase tracking-wider text-cypress/80 block mb-1.5">
                      Phone <span className="text-poppy">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-plaster/30 border-2 border-transparent hover:border-cypress/20 focus:border-chartreuse focus:bg-white rounded-xl focus:outline-none font-host-grotesk text-rosewood transition-all"
                    />
                  </div>
                  <div>
                    <label className="font-host-grotesk font-bold text-xs uppercase tracking-wider text-cypress/80 block mb-1.5">
                      Instagram
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={form.instagram}
                      onChange={handleChange}
                      placeholder="@handle"
                      className="w-full px-4 py-3 bg-plaster/30 border-2 border-transparent hover:border-cypress/20 focus:border-chartreuse focus:bg-white rounded-xl focus:outline-none font-host-grotesk text-rosewood transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="font-host-grotesk font-bold text-xs uppercase tracking-wider text-cypress/80 block mb-1.5">
                    Business Name <span className="text-poppy">*</span>
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-plaster/30 border-2 border-transparent hover:border-cypress/20 focus:border-chartreuse focus:bg-white rounded-xl focus:outline-none font-host-grotesk text-rosewood transition-all"
                  />
                </div>

                <div>
                  <label className="font-host-grotesk font-bold text-xs uppercase tracking-wider text-cypress/80 block mb-1.5">
                    What are you selling? <span className="text-poppy">*</span>
                  </label>
                  <textarea
                    name="products"
                    value={form.products}
                    onChange={handleChange}
                    rows={3}
                    required
                    placeholder="Describe your products (no food trucks please)."
                    className="w-full px-4 py-3 bg-plaster/30 border-2 border-transparent hover:border-cypress/20 focus:border-chartreuse focus:bg-white rounded-xl focus:outline-none font-host-grotesk text-rosewood resize-none transition-all"
                  />
                </div>

                {/* Needs Section (Color Block) */}
                <div className="bg-sand-dune/20 rounded-2xl p-4 sm:p-5 mt-4 border border-sand-dune/50">
                  <p className="font-host-grotesk font-bold text-sm text-rosewood mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-henna" />
                    Do you need any of the following?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      ['needsTent', 'Tent (provided)'],
                      ['needsElectricity', 'Electricity hookup'],
                      ['needsExtensionCord', 'Extension cord for lights'],
                    ].map(([key, label]) => {
                      const isChecked = form[key as keyof typeof form] as boolean
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-cypress text-plaster shadow-sm' 
                              : 'bg-white text-rosewood hover:bg-white/80 border border-rosewood/5'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                            isChecked ? 'bg-chartreuse border-chartreuse' : 'border-rosewood/20 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 text-cypress" />}
                          </div>
                          <input
                            type="checkbox"
                            name={key}
                            checked={isChecked}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="font-host-grotesk font-semibold text-sm">
                            {label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-poppy text-plaster rounded-xl p-4 flex items-start gap-3 shadow-md">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="font-host-grotesk font-semibold text-sm">{error}</p>
              </div>
            )}

            {/* ============================================
                STEP 3: PAYMENT BUTTON / STRIPE
                ============================================ */}
            {!clientSecret ? (
              <button
                type="submit"
                disabled={isSubmitting || selectedDates.length === 0}
                className="w-full bg-rosewood hover:bg-chartreuse text-plaster hover:text-grove font-host-grotesk font-bold text-lg py-5 rounded-2xl transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg group"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {isSubmitting ? 'Creating order...' : `Checkout — $${totalAmount}`}
              </button>
            ) : (
              <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: { 
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#295211', // Cypress
                        colorBackground: '#ffffff',
                        colorText: '#341B1C', // Rosewood
                        fontFamily: 'Host Grotesk, sans-serif',
                      }
                    },
                  }}
                  key={clientSecret}
                >
                  <CheckoutForm
                    clientSecret={clientSecret}
                    totalAmount={totalAmount}
                    onSuccess={() => setSuccess(true)}
                    onError={(m) => setError(m)}
                  />
                </Elements>
                
                <button
                  type="button"
                  onClick={() => {
                    setClientSecret(null)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="w-full text-center mt-4 text-rosewood/50 hover:text-rosewood font-host-grotesk text-sm font-semibold transition-colors"
                >
                  ← Edit application details
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}