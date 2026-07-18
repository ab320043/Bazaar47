'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { SectionContainer } from '@/components/ui/section-container'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Users, ArrowRight, Mail, Phone, AlertCircle, CheckCircle, Upload, ChevronDown, User, Briefcase, Map as MapIcon, Package, PenTool } from 'lucide-react'
import { Reem_Kufi } from 'next/font/google'

const reemKufi = Reem_Kufi({ subsets: ['arabic'], weight: '700' })

export function VendorApplication() {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
  }

  const formFields = [
    { id: 'fullName', label: "What's your FULL name?", icon: User, type: 'text', placeholder: 'Your full name', required: true },
    { id: 'businessName', label: 'Business/Artist name', icon: Briefcase, type: 'text', placeholder: 'As it should appear', required: true },
    { id: 'phone', label: 'Phone number', icon: Phone, type: 'tel', placeholder: '(352) 123-4567', required: true },
    { id: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'you@example.com', required: true },
    { id: 'instagram', label: 'Instagram Handle', icon: User, type: 'text', placeholder: 'the.how.bazar', required: true, prefix: '@' },
    { id: 'city', label: 'Which city are you based in?', icon: MapIcon, type: 'select', options: ['Orlando', 'Miami', 'Jacksonville', 'Tampa', 'Gainesville', 'Other'], required: true },
    { id: 'products', label: 'What types of products do you vend?', icon: Package, type: 'textarea', placeholder: 'Describe your products...', required: true },
    { id: 'bio', label: 'Tell us about yourself', icon: PenTool, type: 'textarea', placeholder: 'Share your story, inspiration, and what makes your work special...', required: true, rows: 4 },
  ]

  return (
    <SectionContainer background="light" spacing="xl" className="relative overflow-hidden">
      
      {/* Clean Plaster Background */}
      <div className="absolute inset-0 bg-plaster" />

      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* ============================================
            HEADER - Newspaper Style (Matching Tour Section)
            ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12 border-b-2 border-rosewood/10 pb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <span className="w-12 h-px bg-chartreuse/60" />
            <span className="font-period text-xs text-rosewood/40 uppercase tracking-[0.3em] font-bold">
              Call for Vendors
            </span>
            <span className="w-12 h-px bg-chartreuse/60" />
          </div>
          
          <h2 className="font-period-narrow font-black text-4xl md:text-5xl lg:text-6xl text-rosewood leading-tight">
            Become a Vendor
          </h2>
          
          <div className={`${reemKufi.className} text-2xl md:text-3xl text-rosewood/20 mt-1`} dir="rtl">
            انضم إلينا كبائع
          </div>
          
          <p className="font-period text-base md:text-lg text-rosewood/60 mt-4 leading-relaxed max-w-2xl">
            Join <b>Bazaar À La Carte</b> as a vendor and share your craft with our community. We are looking for creatives, makers, and artists who want to be part of something special.
          </p>
        </motion.div>

        {/* ============================================
            KEY INFO - Clean Text Layout (No Boxes)
            ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6"
        >
          {/* Deadline - Poppy color */}
          <div className="border-b border-poppy/10 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-poppy text-sm">✦</span>
              <span className="font-period-narrow font-bold text-xl text-poppy">Application Deadline</span>
            </div>
            <p className="font-period text-lg text-rosewood">Friday, July 24th at Midnight</p>
            {/* <p className="font-period text-sm text-poppy/60 mt-1">⚠️ Limited spots available!</p> */}
          </div>

          {/* Location - Henna color */}
          <div className="border-b border-henna/10 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-henna text-sm">✦</span>
              <span className="font-period-narrow font-bold text-xl text-henna">Location</span>
            </div>
            <p className="font-period text-lg text-rosewood">Casselberry Art House</p>
            <p className="font-period text-sm text-rosewood/40">127 Quail Pond Cir, Casselberry, FL 32707</p>
          </div>

          {/* Date - Henna color */}
          <div className="border-b border-henna/10 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-henna text-sm">✦</span>
              <span className="font-period-narrow font-bold text-xl text-henna">Event Date</span>
            </div>
            <p className="font-period text-lg text-rosewood">Saturday, August 8th</p>
            <p className="font-period text-sm text-rosewood/40">Setup: 4:00PM — Market: 6:00PM</p>
          </div>

          {/* Booth Options - Poppy color */}
          <div className="border-b border-poppy/10 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-poppy text-sm">✦</span>
              <span className="font-period-narrow font-bold text-xl text-poppy">Booth Options</span>
            </div>
            <p className="font-period text-lg text-rosewood">Indoor: $75 • Outdoor: $65</p>
            <p className="font-period text-sm text-rosewood/40">Tent provided for outdoor</p>
          </div>
        </motion.div>

        {/* ============================================
            IMPORTANT DETAILS - Text Only
            ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="font-period-narrow font-black text-2xl md:text-5xl lg:text-6xl text-rosewood leading-tight">Important Details</span>
          </div>
          <ul className="font-period text-base text-rosewood/60 space-y-2 pl-4">
            <li className="flex items-start gap-3">
              <span className="text-chartreuse mt-1">✦</span>
              <span>Vendors receive one power source - <b>bring extension cords!</b></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-chartreuse mt-1">✦</span>
              <span>Bring your own table, chair, and lighting.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-chartreuse mt-1">✦</span>
              <span>Friendly booth competition - <b>get creative!</b></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-chartreuse mt-1">✦</span>
              <span>Signage is crucial -<b>make your booth stand out.</b></span>
            </li>
          </ul>
        </motion.div>

        {/* ============================================
            APPLICATION FORM - Clean Newspaper Style
            ============================================ */}
        {!formSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="border-t-2 border-rosewood/10 pt-8"
          >
            {/* Form Header - Clean text */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-period text-lg text-rosewood/40 uppercase tracking-[0.3em] font-bold">Vendor Application</span>
              </div>
              <h3 className="font-period-narrow font-black text-3xl md:text-4xl text-rosewood">
                Tell Us About Yourself
              </h3>
              <p className="font-period text-base text-rosewood/50 mt-2">Fill out this form to be considered as a vendor</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {formFields.map((field, index) => {
                const Icon = field.icon
                const isFocused = focusedField === field.id

                return (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="group"
                  >
                    {/* Label */}
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-4 h-4 ${isFocused ? 'text-chartreuse' : 'text-rosewood/30'} transition-colors duration-300`} />
                      <label className="font-period font-bold text-sm text-rosewood/80">
                        {field.label}
                        {field.required && <span className="text-poppy ml-1">*</span>}
                      </label>
                      <span className="text-rosewood/10 font-period text-xs ml-auto">{String(index + 1).padStart(2, '0')}</span>
                    </div>

                    {/* Input */}
                    <div className="relative">
                      {field.type === 'select' ? (
                        <div className="relative">
                          <select
                            required={field.required}
                            className="w-full px-4 py-3 bg-plaster/30 border-b-2 border-rosewood/10 focus:border-chartreuse outline-none transition-all duration-300 font-period text-rosewood appearance-none"
                            onFocus={() => setFocusedField(field.id)}
                            onBlur={() => setFocusedField(null)}
                          >
                            <option value="">Select your city</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt.toLowerCase()}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rosewood/30 pointer-events-none" />
                        </div>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          required={field.required}
                          rows={field.rows || 3}
                          className="w-full px-4 py-3 bg-plaster/30 border-b-2 border-rosewood/10 focus:border-chartreuse outline-none transition-all duration-300 font-period text-rosewood resize-none"
                          placeholder={field.placeholder}
                          onFocus={() => setFocusedField(field.id)}
                          onBlur={() => setFocusedField(null)}
                        />
                      ) : (
                        <div className="flex items-center">
                          {field.prefix && (
                            <span className="px-3 py-3 bg-plaster/30 border-b-2 border-rosewood/10 text-rosewood/40 font-period">
                              {field.prefix}
                            </span>
                          )}
                          <input
                            type={field.type}
                            required={field.required}
                            className={`flex-1 px-4 py-3 bg-plaster/30 border-b-2 border-rosewood/10 focus:border-chartreuse outline-none transition-all duration-300 font-period text-rosewood ${field.prefix ? 'border-l-0' : ''}`}
                            placeholder={field.placeholder}
                            onFocus={() => setFocusedField(field.id)}
                            onBlur={() => setFocusedField(null)}
                          />
                        </div>
                      )}

                      {/* Focus underline */}
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-chartreuse"
                        initial={{ width: 0 }}
                        animate={{ width: isFocused ? '100%' : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )
              })}

              {/* Booth Option */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="pt-2"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-4 h-4 text-rosewood/30" />
                  <label className="font-period font-bold text-sm text-rosewood/80">
                    Which booth option do you prefer? <span className="text-poppy">*</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'indoor', label: 'Indoor Booth', desc: "6'x6' space • $75" },
                    { id: 'outdoor', label: 'Outdoor Booth', desc: "10'x10' space • $65" },
                    { id: 'either', label: 'Either Option', desc: "We'll choose for you" },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedOption === option.id
                          ? 'border-chartreuse bg-chartreuse/5'
                          : 'border-rosewood/10 hover:border-rosewood/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="boothOption"
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="mt-0.5 w-4 h-4 text-chartreuse accent-chartreuse"
                      />
                      <div>
                        <span className="font-period font-bold text-sm text-rosewood block">{option.label}</span>
                        <span className="font-period text-xs text-rosewood/40">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-3 text-xs text-rosewood/30 font-period space-y-1 text-center">
                  <p>• Indoor: high energy, music inside • Outdoor: custom stalls with string lights</p>
                </div>
              </motion.div>

              {/* Photo Upload */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.55 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Upload className="w-4 h-4 text-rosewood/30" />
                  <label className="font-period font-bold text-sm text-rosewood/80">Upload product photos</label>
                </div>
                <div className="border-2 border-dashed border-rosewood/20 rounded-2xl p-8 text-center hover:border-chartreuse/40 transition-all duration-300 cursor-pointer group bg-plaster/20">
                  <Upload className="w-10 h-10 text-rosewood/20 group-hover:text-chartreuse/40 transition-colors mx-auto mb-3" />
                  <p className="font-period text-sm text-rosewood/40 group-hover:text-rosewood/60 transition-colors">
                    Drop photos here or click to browse
                  </p>
                  <p className="font-period text-xs text-rosewood/20 mt-1">Up to 5 files, 10GB max</p>
                </div>
              </motion.div>

              {/* Promotion Agreement */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="bg-plaster/30 rounded-xl p-5 border border-rosewood/10"
              >
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" className="mt-0.5 w-5 h-5 text-chartreuse accent-chartreuse rounded border-rosewood/20" />
                  <div>
                    <span className="font-period text-sm text-rosewood/70 group-hover:text-rosewood transition-colors">
                      I agree to promote the event on my social media platforms
                    </span>
                    <span className="block font-period text-xs text-rosewood/40 mt-0.5">
                      Promotion is key to a successful market — we are in this together!
                    </span>
                  </div>
                </label>
              </motion.div>

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.65 }}
              >
                <button
                  type="submit"
                  className="w-full bg-rosewood hover:bg-rosewood/80 text-plaster py-4 rounded-full font-period-narrow font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Submit Application
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
                <div className="mt-3 text-center font-period text-sm text-poppy font-bold">
                  ⚠️ Deadline: Friday, July 24th at Midnight
                </div>
              </motion.div>
            </form>
          </motion.div>
        ) : (
          /* Success Message */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-t-2 border-chartreuse/30 pt-12 text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-chartreuse">✦</span>
              <CheckCircle className="w-12 h-12 text-chartreuse" />
              <span className="text-chartreuse">✦</span>
            </div>
            <h3 className="font-period-narrow font-black text-4xl text-rosewood">Application Received!</h3>
            <p className="font-period text-lg text-rosewood/60 mt-3 max-w-md mx-auto">
              Thank you for applying to be a vendor at Bazaar À La Carte. We will review your application and be in touch soon.
            </p>
            <div className="mt-6 p-4 bg-plaster/50 rounded-xl border border-rosewood/10 inline-block mx-auto">
              <p className="font-period text-sm text-rosewood/50 flex items-center gap-2 justify-center">
                <Phone className="w-4 h-4" />
                Laila Fakhoury — (352) 266-1267
              </p>
              <p className="font-period text-sm text-rosewood/50 flex items-center gap-2 justify-center mt-1">
                <Mail className="w-4 h-4" />
                laila@diondia.com
              </p>
            </div>
          </motion.div>
        )}

        {/* ============================================
            CONTACT INFO - Clean Footer
            ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t-2 border-rosewood/10 text-center"
        >
          <div className="flex flex-wrap justify-center items-center gap-6 text-rosewood font-period text-md font-bold">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              laila@diondia.com
            </span>
            <span className="hidden sm:inline text-rosewood">•</span>
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              (352) 266-1267
            </span>
            <span className="hidden sm:inline text-rosewood">•</span>
            <span className="flex items-center gap-2 text-rosewood">
              @the.how.bazar
            </span>
          </div>
          <p className="font-period text-md font-bold text-rosewood/60 mt-3">
            Follow us on Instagram for updates
          </p>
        </motion.div>
      </div>
    </SectionContainer>
  )
}