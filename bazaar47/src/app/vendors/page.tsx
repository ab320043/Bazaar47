'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { ArrowRight, ArrowLeft, X, CheckCircle, MapPin, Calendar, Clock, Users, Music, AlertCircle } from 'lucide-react'
import VendorSplash from '@/assets/newAssets/VendorSplash.png'
import floridaTourText from '@/assets/newAssets/floridaTourText.png'

export default function VendorsPage() {
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedBooth, setSelectedBooth] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    pronouns: '',
    city: '',
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
    boothOption: '',
    bringItems: 'yes',
    noiseSensitive: 'no',
    payFee: 'yes',
    recommendVendors: '',
    additionalInfo: '',
  })

  const formRef = useRef<HTMLFormElement>(null)

  const cities = ['Orlando', 'South Florida', 'Jacksonville', 'Gainesville', 'Tampa', 'Gainesville Finale']

  const handleCityToggle = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city]
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', { ...formData, selectedCities, selectedBooth })
    setFormSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleApplyClick = () => {
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleBackToHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsExiting(true)
    
    // Wait for exit animation then navigate
    setTimeout(() => {
      window.location.href = '/'
    }, 500)
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

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-chartreuse">
      
      {/* ============================================
          BACKGROUND IMAGE LAYER
          ============================================ */}
      <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <Image
          src={VendorSplash}
          alt="Bazaar 47 Vendor"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* ============================================
          MAIN CONTENT
          ============================================ */}
      <motion.div 
        className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 min-h-screen"
        initial="initial"
        animate={isExiting ? "exit" : "animate"}
        variants={pageVariants}
        transition={{ duration: 0.5 }}
      >
        {/* Back to Home with smooth transition */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
          <Link 
            href="/"
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 text-grove/60 hover:text-grove transition-colors font-host-grotesk text-sm group"
          >
            <motion.span
              whileHover={{ x: -4 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.span>
            <motion.span
              whileHover={{ x: -2 }}
              transition={{ duration: 0.2 }}
            >
              Back
            </motion.span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* ============================================
              LANDING VIEW
              ============================================ */}
          {!showForm && !formSubmitted && (
            <motion.div
              key="landing"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.5 }}
              className="min-h-screen flex flex-col items-center justify-center -mt-16 md:-mt-20 lg:-mt-24"
            >
              {/* Banner */}
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

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-host-grotesk font-bold text-5xl sm:text-[65px] md:text-[75px] leading-[89%] tracking-normal text-grove text-center"
              >
                Become a Vendor
              </motion.h1>

              {/* Description */}
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

              {/* Apply Button */}
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

          {/* ============================================
              FORM VIEW
              ============================================ */}
          {showForm && !formSubmitted && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              id="form-section"
              className="py-12 md:py-20"
            >
              <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-10 border border-rosewood/10">
                
                {/* Form Header */}
                <div className="mb-8 pb-6 border-b border-rosewood/10">
                  <h2 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood">
                    Vendor Application
                  </h2>
                  <p className="font-host-grotesk text-rosewood/60 mt-2">
                    Bazaar À La Carte : Florida Tour
                  </p>
                  <div className="mt-4 p-4 bg-poppy/10 rounded-xl border border-poppy/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-poppy flex-shrink-0 mt-0.5" />
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

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="font-host-grotesk font-semibold text-xl text-rosewood flex items-center gap-2">
                      <span className="text-chartreuse">✦</span>
                      Personal Information
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
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4 pt-4 border-t border-rosewood/10">
                    <h3 className="font-host-grotesk font-semibold text-xl text-rosewood flex items-center gap-2">
                      <span className="text-chartreuse">✦</span>
                      Contact Information
                    </h3>
                    
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

                  {/* City Selection - Multi-select */}
                  <div className="space-y-4 pt-4 border-t border-rosewood/10">
                    <h3 className="font-host-grotesk font-semibold text-xl text-rosewood flex items-center gap-2">
                      <span className="text-chartreuse">✦</span>
                      Which cities are you interested in? <span className="text-poppy">*</span>
                    </h3>
                    <p className="font-host-grotesk text-sm text-rosewood/50">Select one or multiple cities</p>
                    
                    <div className="flex flex-wrap gap-3">
                      {cities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleCityToggle(city)}
                          className={`px-4 py-2 rounded-full font-host-grotesk text-sm font-semibold transition-all duration-300 ${
                            selectedCities.includes(city)
                              ? 'bg-chartreuse text-grove shadow-md scale-105'
                              : 'bg-plaster/50 text-rosewood/60 hover:bg-plaster/80'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vendor Details */}
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

                  {/* Booth Option */}
                  <div className="space-y-4 pt-4 border-t border-rosewood/10">
                    <h3 className="font-host-grotesk font-semibold text-xl text-rosewood flex items-center gap-2">
                      <span className="text-chartreuse">✦</span>
                      Booth Preference <span className="text-poppy">*</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { id: 'indoor', label: 'Indoor Booth', desc: '6\'x6\' space • $75' },
                        { id: 'outdoor', label: 'Outdoor Booth', desc: '10\'x10\' space • $65' },
                        { id: 'either', label: 'Either Option', desc: 'We\'ll choose for you' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedBooth(option.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                            selectedBooth === option.id
                              ? 'border-chartreuse bg-chartreuse/5 shadow-md'
                              : 'border-rosewood/10 hover:border-rosewood/30'
                          }`}
                        >
                          <p className={`font-host-grotesk font-bold text-sm ${selectedBooth === option.id ? 'text-rosewood' : 'text-rosewood/60'}`}>
                            {option.label}
                          </p>
                          <p className="font-host-grotesk text-xs text-rosewood/40">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Questions */}
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
                        { id: 'payFee', label: 'Can you pay vendor fee by July 31?', options: ['Yes, I can pay by July 31', 'Other'] },
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
                    </div>
                  </div>

                  {/* Additional Info */}
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-cypress hover:bg-cypress/90 text-plaster font-host-grotesk font-bold text-lg py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02]"
                  >
                    Submit Application
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ============================================
              SUCCESS VIEW
              ============================================ */}
          {formSubmitted && (
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

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="font-host-grotesk text-sm text-grove/30 mt-6"
              >
                ✦ We will be in touch soon! ✦
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}