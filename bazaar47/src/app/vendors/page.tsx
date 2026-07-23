'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { ArrowRight, ArrowLeft, CheckCircle, AlertCircle, MapPin, Calendar, ExternalLink } from 'lucide-react'
import VendorSplash from '@/assets/newAssets/VendorSplash.png'
import floridaTourText from '@/assets/newAssets/floridaTourText.png'

const cityOptions = [
  {
    id: 'orlando',
    name: 'Orlando',
    date: 'Saturday, August 8',
    venue: 'Casselberry Arts Center',
    pricing: [
      { label: 'Indoor Booth', price: '$75', size: '6\'x6\'', note: 'No tent required' },
      { label: 'Outdoor Booth', price: '$60', size: '8\'x8\'', note: 'WE WILL PROVIDE OUTDOOR VENDOR STALLS' },
    ],
    status: 'open',
  },
  {
    id: 'south-florida',
    name: 'South Florida',
    date: 'Saturday, September 12',
    venue: 'MAD Arts',
    pricing: [
      { label: 'Outdoor Booth', price: '$70', size: '8\'x8\'', note: 'We will provide booths' },
    ],
    status: 'open',
  },
  {
    id: 'jacksonville',
    name: 'Jacksonville',
    date: 'Saturday, October 7',
    venue: 'Third Wednesday Art Walk',
    pricing: [
      { label: 'Outdoor Booth', price: '$45', size: '10\'x10\'', note: 'External Application' },
    ],
    status: 'external',
    externalLink: '#',
  },
  {
    id: 'gainesville-fest',
    name: 'Gainesville | The FEST',
    date: 'Saturday, October 24',
    venue: 'Downtown Gainesville',
    pricing: [
      { label: 'Outdoor Booth', price: '$200', size: '10\'x10\'', note: 'During The FEST' },
    ],
    status: 'open',
  },
  {
    id: 'gainesville-finale',
    name: 'Gainesville',
    date: 'Saturday, December 5',
    venue: 'Bazaar47',
    pricing: [
      { label: 'Outdoor Booth', price: '$40', size: '10\'x10\'', note: 'Closing night' },
    ],
    status: 'open',
  },
  {
    id: 'tampa',
    name: 'Tampa',
    date: 'TBA',
    venue: 'CAMP Tampa',
    pricing: [
      { label: 'TBA', price: 'TBA', size: 'TBA', note: 'Details coming soon' },
    ],
    status: 'tba',
  },
]

export default function VendorsPage() {
  // Step 1: Show city selection
  const [step, setStep] = useState<'landing' | 'cities' | 'form' | 'success'>('landing')
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedPricing, setSelectedPricing] = useState<Record<string, string>>({})
  const [isExiting, setIsExiting] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    pronouns: '',
    businessName: '',
    phone: '',
    email: '',
    instagram: '',
    instagramLink: '',
    products: '',
    pricePoints: '',
    bio: '',
    vendorHighlight: 'yes',
    photography: 'yes',
    promotion: 'yes',
    bringItems: 'yes',
    noiseSensitive: 'no',
    payFee: 'yes',
    recommendVendors: '',
    additionalInfo: '',
  })

  

  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  const getPaymentDeadlineForCities = () => {
    if (selectedCities.length === 0) return 'Please select a city'
    return 'Friday, July 31, 2026'
  }

  const handleCityToggle = (cityId: string) => {
    setSelectedCities(prev =>
      prev.includes(cityId)
        ? prev.filter(c => c !== cityId)
        : [...prev, cityId]
    )
    if (selectedCities.includes(cityId)) {
      setSelectedPricing(prev => {
        const newPricing = { ...prev }
        delete newPricing[cityId]
        return newPricing
      })
    }
  }

  const handlePricingSelect = (cityId: string, pricingLabel: string) => {
    setSelectedPricing(prev => ({
      ...prev,
      [cityId]: pricingLabel,
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const saveToAdmin = async (data: Record<string, unknown>, type: 'vendor' | 'rsvp') => {
  try {
    const response = await fetch('/api/admin/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, type }),
    })
    if (!response.ok) {
      console.error('Failed to save to admin')
    }
  } catch (error) {
    console.error('Failed to save to admin:', error)
  }
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('https://formspree.io/f/xzdnaegk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          selectedCities: selectedCities.map(id => {
            const city = cityOptions.find(c => c.id === id)
            return {
              city: city?.name,
              pricing: selectedPricing[id] || 'Not specified',
            }
          }),
          paymentDeadline: 'Friday, July 31, 2026',
          _subject: `Vendor Application - ${formData.businessName || 'New Applicant'}`,
        }),
      })

      if (response.ok) {
        await saveToAdmin({
        ...formData,
        selectedCities: selectedCities.map(id => {
          const city = cityOptions.find(c => c.id === id)
          return {
            city: city?.name,
            pricing: selectedPricing[id] || 'Not specified',
          }
        }),
      }, 'vendor')
        setFormSubmitted(true)
        setStep('success')
        setFormData({
          fullName: '',
          preferredName: '',
          pronouns: '',
          businessName: '',
          phone: '',
          email: '',
          instagram: '',
          instagramLink: '',
          products: '',
          pricePoints: '',
          bio: '',
          vendorHighlight: 'yes',
          photography: 'yes',
          promotion: 'yes',
          bringItems: 'yes',
          noiseSensitive: 'no',
          payFee: 'yes',
          recommendVendors: '',
          additionalInfo: '',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        alert('Something went wrong. Please try again or contact us directly.')
      }
    } catch (error) {
      alert('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApplyClick = () => {
    setStep('cities')
    setTimeout(() => {
      document.getElementById('city-selection')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleBackToHome = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault()
    setIsExiting(true)
    setTimeout(() => {
      window.location.href = '/'
    }, 500)
  }

  const handleBackToCities = () => {
    setStep('cities')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProceedToForm = () => {
    if (selectedCities.length === 0) {
      alert('Please select at least one city before proceeding.')
      return
    }
    setStep('form')
    setTimeout(() => {
      document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.4 } }
  }

  const canProceed = selectedCities.length > 0


  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-chartreuse">
      
      <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <Image
          src={VendorSplash}
          alt="Bazaar 47 Vendor"
          fill
          className="object-cover"
          priority
        />
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 min-h-screen"
        initial="initial"
        animate={isExiting ? "exit" : "animate"}
        variants={pageVariants}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
          <Link 
            href="/"
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 text-grove/60 hover:text-grove transition-colors font-host-grotesk text-sm group"
          >
            <motion.span whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
              <ArrowLeft className="w-4 h-4" />
            </motion.span>
            <motion.span whileHover={{ x: -2 }} transition={{ duration: 0.2 }}>
              Back
            </motion.span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* LANDING VIEW */}
          {step === 'landing' && (
            <motion.div
              key="landing"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.5 }}
              className="min-h-screen flex flex-col items-center justify-center -mt-16 md:-mt-20 lg:-mt-24"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-4 md:mb-6"
              >
                <Image
                  src={floridaTourText}
                  alt="Bazaar À La Carte"
                  className="object-contain w-40 h-auto"
                  priority
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-host-grotesk font-bold text-5xl sm:text-[65px] md:text-[75px] leading-[89%] tracking-normal text-grove text-center"
              >
                Become a Vendor
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 md:mt-6 max-w-2xl text-center"
              >
                <p className="font-host-grotesk font-regular text-md sm:text-[22px] md:text-[24px] leading-[108%] tracking-normal text-grove">
                  Join Bazaar Florida Tour as a vendor and share your craft with our community.
                </p>
                <p className="font-host-grotesk font-regular text-md sm:text-[22px] md:text-[24px] leading-[108%] tracking-normal text-grove mt-1">
                  We are looking for creatives, makers, and artists who want to be part of something special.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6 md:mt-8"
              >
                <button
                  onClick={handleApplyClick}
                  className="bg-cypress hover:bg-cypress/90 text-plaster font-host-grotesk font-bold text-base md:text-lg transition-all duration-300 flex items-center justify-center gap-3 px-8 py-3 rounded-lg hover:scale-105"
                >
                  Vendor Application
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* CITY SELECTION VIEW - Simplified (only select cities, no pricing) */}
          {step === 'cities' && (
            <motion.div
              key="cities"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              id="city-selection"
              className="py-12 md:py-20"
            >
              <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-10 border border-rosewood/10">
                
                <div className="mb-8 pb-6 border-b border-rosewood/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood">
                        Select Cities
                      </h2>
                      <p className="font-host-grotesk text-rosewood/60 mt-2">
                        Choose the cities you would like to vend at
                      </p>
                    </div>
                    <span className="text-sm font-host-grotesk font-semibold text-rosewood bg-chartreuse/10 px-3 py-1 rounded-full">
                      {selectedCities.length} selected
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {cityOptions.map((city) => {
                    const isSelected = selectedCities.includes(city.id)
                    const isTampa = city.id === 'tampa'
                    const isJacksonville = city.id === 'jacksonville'

                    return (
                      <motion.div
                        key={city.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`rounded-2xl border-2 p-5 transition-all duration-300 ${
                          isSelected
                            ? 'border-chartreuse bg-chartreuse/5'
                            : isTampa
                            ? 'border-rosewood/10 bg-rosewood/5 opacity-60'
                            : 'border-rosewood/10 hover:border-rosewood/30'
                        }`}
                      >
                        {/* City Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isTampa && !isJacksonville) {
                                    handleCityToggle(city.id)
                                  }
                                }}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-chartreuse border-chartreuse'
                                    : isTampa || isJacksonville
                                    ? 'border-rosewood/20 cursor-not-allowed'
                                    : 'border-rosewood/30 hover:border-rosewood/50'
                                }`}
                                disabled={isTampa || isJacksonville}
                              >
                                {isSelected && (
                                  <CheckCircle className="w-4 h-4 text-grove" strokeWidth={3} />
                                )}
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-host-grotesk font-bold text-lg text-rosewood">
                                    {city.name}
                                  </h4>
                                  {isTampa && (
                                    <span className="text-xs bg-rosewood/10 text-rosewood/50 px-2 py-0.5 rounded-full">
                                      TBA
                                    </span>
                                  )}
                                  {/* {isJacksonville && (
                                    <span className="text-xs bg-chartreuse/20 text-chartreuse/70 px-2 py-0.5 rounded-full">
                                      External App
                                    </span>
                                  )} */}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-rosewood/50 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {city.date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {city.venue}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Jacksonville - External link */}
                        {isJacksonville && (
                          <div className="mt-4 pt-4 border-t border-rosewood/10">
                            <div className="bg-chartreuse/10 rounded-xl p-4 text-center">
                              <p className="font-host-grotesk text-sm text-rosewood/60">{city.pricing[0].note}</p>
                            </div>
                            <button
                              type="button"
                              className="w-full mt-3 flex items-center justify-center gap-2 bg-cypress/10 hover:bg-cypress/20 text-cypress font-host-grotesk font-semibold text-sm py-2.5 rounded-xl transition-colors"
                            >
                              Apply via External Link
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Tampa TBA */}
                        {isTampa && (
                          <p className="mt-2 text-sm text-rosewood/40 italic">
                            Details coming soon. Stay tuned!
                          </p>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Bottom Actions */}
                <div className="mt-8 pt-6 border-t border-rosewood/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleBackToHome}
                    className="text-rosewood/60 hover:text-rosewood transition-colors font-host-grotesk text-sm flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleProceedToForm}
                    disabled={!canProceed}
                    className="bg-cypress hover:bg-cypress/90 text-plaster font-host-grotesk font-bold text-base px-8 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  >
                    Continue to Application
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* FORM VIEW - With Booth Selection Per City */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              id="form-section"
              className="py-12 md:py-20"
            >
              <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-10 border border-rosewood/10">
                
                <div className="mb-8 pb-6 border-b border-rosewood/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood">
                        Vendor Application
                      </h2>
                      <p className="font-host-grotesk text-rosewood/60 mt-1">
                        Bazaar À La Carte : Florida Tour
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBackToCities}
                      className="text-rosewood/40 hover:text-rosewood transition-colors font-host-grotesk text-sm flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Change Cities
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCities.map(id => {
                      const city = cityOptions.find(c => c.id === id)
                      return (
                        <span key={id} className="bg-chartreuse/10 text-osewood text-xs px-3 py-1 rounded-full font-host-grotesk font-semibold">
                          {city?.name}
                        </span>
                      )
                    })}
                  </div>
                  <div className="mt-4 p-4 bg-poppy/10 rounded-xl border border-poppy/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-poppy shrink-0 mt-0.5" />
                    <div>
                      <p className="font-host-grotesk font-bold text-poppy text-sm">
                        DEADLINE: Friday, July 24th at Midnight
                      </p>
                      <p className="font-host-grotesk text-poppy/70 text-sm">
                        Limited spots available! Apply ASAP.
                      </p>
                    </div>
                  </div>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* BOOTH SELECTION PER CITY - New section in form */}
                  <div className="space-y-4">
                    <h3 className="font-host-grotesk font-semibold text-xl text-rosewood flex items-center gap-2">
                      <span className="text-chartreuse">✦</span>
                      Select Booth Options
                    </h3>
                    <p className="font-host-grotesk text-sm text-rosewood/50">
                      Choose your booth preference for each selected city
                    </p>

                    <div className="space-y-4">
                      {selectedCities.map((cityId) => {
                        const city = cityOptions.find(c => c.id === cityId)
                        if (!city || city.status === 'tba' || city.status === 'external') return null
                        
                        return (
                          <div key={cityId} className="bg-plaster/30 rounded-xl p-4 border border-rosewood/10">
                            <h4 className="font-host-grotesk font-bold text-base text-rosewood mb-3">
                              {city.name}
                            </h4>
                            <div className="space-y-2">
                              {city.pricing.map((option) => (
                                <button
                                  key={option.label}
                                  type="button"
                                  onClick={() => handlePricingSelect(cityId, option.label)}
                                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                                    selectedPricing[cityId] === option.label
                                      ? 'border-chartreuse bg-chartreuse/10'
                                      : 'border-rosewood/20 hover:border-rosewood/30'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-host-grotesk font-semibold text-sm text-rosewood mb-2">
                                        {option.label}
                                      </p>
                                      <p className="font-host-grotesk textsm font-bold text-rosewood/50 mb-2">
                                        {option.size} · {option.price}
                                      </p>
                                    </div>
                                    {selectedPricing[cityId] === option.label && (
                                      <CheckCircle className="w-5 h-5 text-chartreuse" />
                                    )}
                                  </div>
                                  {option.note && (
                                    <p className="font-host-grotesk text-xs text-rosewood/70 mt-1">
                                      📌 {option.note}
                                    </p>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* PERSONAL INFORMATION */}
                  <div className="space-y-4 pt-4 border-t border-rosewood/10">
                    <h3 className="font-host-grotesk font-semibold text-xl text-rosewood flex items-center gap-2">
                      <span className="text-chartreuse">✦</span>
                      Your Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                          Full Name <span className="text-poppy">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                          Preferred Name
                        </label>
                        <input
                          type="text"
                          name="preferredName"
                          value={formData.preferredName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                          placeholder="What should we call you?"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                        Pronouns
                      </label>
                      <input
                        type="text"
                        name="pronouns"
                        value={formData.pronouns}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                        placeholder="e.g. they/them, she/her, he/him"
                      />
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                        Business/Artist Name <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                        placeholder="Your business name as it should appear"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                          Phone Number <span className="text-poppy">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                          placeholder="(352) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                          Email <span className="text-poppy">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                        Instagram Handle <span className="text-poppy">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-host-grotesk text-rosewood/40 bg-plaster/50 px-3 py-3 rounded-xl border border-rosewood/20">@</span>
                        <input
                          type="text"
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleInputChange}
                          required
                          className="flex-1 px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                          placeholder="yourhandle"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                        Instagram Profile Link <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="url"
                        name="instagramLink"
                        value={formData.instagramLink}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                        placeholder="https://www.instagram.com/yourhandle"
                      />
                    </div>
                  </div>

                  {/* VENDOR DETAILS */}
                  <div className="space-y-4 pt-4 border-t border-rosewood/10">
                    <h3 className="font-host-grotesk font-semibold text-xl text-rosewood flex items-center gap-2">
                      <span className="text-chartreuse">✦</span>
                      Vendor Details
                    </h3>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                        What types of products/items do you plan on vending? <span className="text-poppy">*</span>
                      </label>
                      <textarea
                        name="products"
                        value={formData.products}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                        placeholder="Describe your products..."
                      />
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                        General price points of your products <span className="text-poppy">*</span>
                      </label>
                      <input
                        type="text"
                        name="pricePoints"
                        value={formData.pricePoints}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                        placeholder="e.g. $5-25, $30-50, etc."
                      />
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                        Tell us about yourself <span className="text-poppy">*</span>
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                        placeholder="Share your story, inspiration, and what makes your work special..."
                      />
                    </div>
                  </div>

                  {/* QUICK QUESTIONS */}
                  <div className="space-y-4 pt-4 border-t border-rosewood/10">
                    <h3 className="font-host-grotesk font-semibold text-xl text-rosewood flex items-center gap-2">
                      <span className="text-chartreuse">✦</span>
                      Quick Questions
                    </h3>

                    <div className="space-y-3">
                      {[
                        { id: 'vendorHighlight', label: 'Ok to post vendor highlight?', options: ['Yes', 'No'] },
                        { id: 'photography', label: 'Ok with photography/videography?', options: ['Yes, I don\'t mind', 'Nah, no photography pls'] },
                        { id: 'promotion', label: 'Will you promote the event?', options: ['Yes, of course!', 'Ehhhh'] },
                        { id: 'bringItems', label: 'Can you bring table, chair, extension cables?', options: ['Yes', 'No'] },
                        { id: 'noiseSensitive', label: 'Sensitive to noise/music?', options: ['Yes, put me far away', 'Nah, I\'m good'] },
                      ].map((q) => (
                        <div key={q.id}>
                          <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                            {q.label} <span className="text-poppy">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, [q.id]: opt }))}
                                className={`px-4 py-1.5 rounded-full text-sm font-host-grotesk transition-all duration-300 ${
                                  formData[q.id as keyof typeof formData] === opt
                                    ? 'bg-chartreuse text-grove shadow-md'
                                    : 'bg-plaster/50 text-rosewood/60 hover:bg-plaster/80'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div>
                        <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                          Can you pay your vendor fee by the deadline? <span className="text-poppy">*</span>
                        </label>
                        <div className="bg-plaster/30 rounded-xl p-3 mb-2">
                          <p className="font-host-grotesk text-sm text-rosewood/60">
                            <span className="font-medium text-rosewood">Payment Deadline:</span>{' '}
                            <span className="text-rosewood font-semibold">
                              Friday, July 31, 2026
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['Yes, I can pay by the deadline', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, payFee: opt }))}
                              className={`px-4 py-1.5 rounded-full text-sm font-host-grotesk transition-all duration-300 ${
                                formData.payFee === opt
                                  ? 'bg-chartreuse text-grove shadow-md'
                                  : 'bg-plaster/50 text-rosewood/60 hover:bg-plaster/80'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ADDITIONAL INFO */}
                  <div className="space-y-4 pt-4 border-t border-rosewood/10">
                    <h3 className="font-host-grotesk font-semibold text-xl text-rosewood flex items-center gap-2">
                      <span className="text-chartreuse">✦</span>
                      Anything Else?
                    </h3>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                        Vendors you would like to recommend
                      </label>
                      <input
                        type="text"
                        name="recommendVendors"
                        value={formData.recommendVendors}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                        placeholder="Any vendors you'd like to recommend?"
                      />
                    </div>

                    <div>
                      <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1">
                        Additional information
                      </label>
                      <textarea
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 font-host-grotesk text-rosewood"
                        placeholder="Anything else you'd like us to know?"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-cypress hover:bg-cypress/90 text-plaster font-host-grotesk font-bold text-lg py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* SUCCESS VIEW */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="min-h-screen flex flex-col items-center justify-center -mt-16 md:-mt-20 lg:-mt-24 px-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="bg-chartreuse/20 w-24 h-24 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-12 h-12 text-chartreuse" strokeWidth={2} />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-host-grotesk font-bold text-4xl md:text-5xl text-grove text-center"
              >
                We Got Your Application!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-host-grotesk text-lg md:text-xl text-grove/70 mt-4 text-center max-w-md"
              >
                Will reach out to ya soon! ✦
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <Link href="/">
                  <button className="bg-cypress hover:bg-cypress/90 text-plaster font-host-grotesk font-bold text-base md:text-lg transition-all duration-300 flex items-center justify-center gap-3 px-8 py-3 rounded-lg hover:scale-105">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Home
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}