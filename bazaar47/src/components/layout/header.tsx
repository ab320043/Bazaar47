'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import BLACK from '@/assets/BLACK.svg'
import WHITE from '@/assets/WHITE.svg'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Menu, X, ChevronDown } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useTheme } from 'next-themes'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isToursDropdownOpen, setIsToursDropdownOpen] = useState(false)
  const { items, itemCount, removeItem, updateQuantity, totalPrice } = useCart()
  const { theme } = useTheme()
  const toursRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const cart = document.getElementById('cart-slide')
      if (cart && !cart.contains(e.target as Node)) {
        setIsCartOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close tours dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toursRef.current && !toursRef.current.contains(e.target as Node)) {
        setIsToursDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const tourCities = ['Gainesville', 'Orlando', 'South Florida', 'Jacksonville']

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-medium
          ${isScrolled ? 'bg-plaster/95 backdrop-blur-sm shadow-md' : 'bg-transparent'}
          dark:${isScrolled ? 'bg-grove/95 backdrop-blur-sm' : 'bg-transparent'}
        `}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Left Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-10 flex-1">
              {/* Tours with Dropdown */}
              <div className="relative" ref={toursRef}>
                <button
                  onMouseEnter={() => setIsToursDropdownOpen(true)}
                  className="flex items-center gap-1 font-period font-bold text-base text-rosewood/80 hover:text-rosewood transition-colors dark:text-plaster/80 dark:hover:text-plaster group"
                >
                  Tours
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isToursDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isToursDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-plaster dark:bg-grove rounded-lg shadow-xl border border-sand-dune dark:border-cypress overflow-hidden"
                      onMouseLeave={() => setIsToursDropdownOpen(false)}
                    >
                      <div className="py-2">
                        <div className="px-4 py-2 bg-sand-dune/10 dark:bg-cypress/10">
                          <p className="font-period-narrow text-sm text-rosewood/60 dark:text-plaster/60">
                            Bazar à la Carte
                          </p>
                        </div>
                        {tourCities.map((city) => (
                          <Link
                            key={city}
                            href={`/tours/${city.toLowerCase().replace(' ', '-')}`}
                            className="block px-4 py-2 font-period text-rosewood dark:text-plaster hover:bg-sand-dune/20 dark:hover:bg-cypress/20 transition-all duration-200 hover:pl-6"
                            onClick={() => setIsToursDropdownOpen(false)}
                          >
                            {city}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link 
                href="/events" 
                className="font-period font-bold text-base text-rosewood/80 hover:text-rosewood transition-all duration-200 hover:scale-105 dark:text-plaster/80 dark:hover:text-plaster"
              >
                Events
              </Link>
              <Link 
                href="/about" 
                className="font-period font-bold text-base text-rosewood/80 hover:text-rosewood transition-all duration-200 hover:scale-105 dark:text-plaster/80 dark:hover:text-plaster"
              >
                About
              </Link>
            </nav>

            {/* Logo - Centered */}
            <Link href="/" className="flex-shrink-0 absolute left-1/2 -translate-x-1/2">
              <motion.div 
                className="relative w-[120px] h-[40px]"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'dark' ? (
                  <Image
                    src={WHITE}
                    alt="Bazaar 47"
                    fill
                    className="object-contain"
                    priority
                  />
                ) : (
                  <Image
                    src={BLACK}
                    alt="Bazaar 47"
                    fill
                    className="object-contain scale-150"
                    priority
                  />
                )}
              </motion.div>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 flex-1 justify-end">
              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-sand-dune/30 rounded-full transition-all duration-200 hover:scale-110 dark:hover:bg-cypress/30"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5 text-rosewood dark:text-plaster" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-henna text-plaster text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </button>

              {/* Mobile Menu */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-sand-dune/30 rounded-full transition-all duration-200 hover:scale-110 dark:hover:bg-cypress/30"
                aria-label="Menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-rosewood dark:text-plaster" />
                ) : (
                  <Menu className="w-5 h-5 text-rosewood dark:text-plaster" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden bg-plaster dark:bg-grove border-t border-sand-dune dark:border-cypress"
            >
              <motion.nav 
                className="container mx-auto px-4 py-6 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Tours with dropdown in mobile */}
                <div>
                  <button
                    onClick={() => setIsToursDropdownOpen(!isToursDropdownOpen)}
                    className="flex items-center justify-between w-full font-period font-bold text-lg text-rosewood dark:text-plaster hover:text-henna dark:hover:text-chartreuse transition-colors"
                  >
                    Tours
                    <motion.div
                      animate={{ rotate: isToursDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isToursDropdownOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 ml-4 space-y-2 border-l-2 border-sand-dune dark:border-cypress pl-4">
                          <p className="font-period-narrow text-sm text-rosewood/60 dark:text-plaster/60 mb-2">
                            Bazar à la Carte
                          </p>
                          {tourCities.map((city) => (
                            <Link
                              key={city}
                              href={`/tours/${city.toLowerCase().replace(' ', '-')}`}
                              className="block font-period text-rosewood dark:text-plaster hover:text-henna dark:hover:text-chartreuse transition-colors py-1"
                              onClick={() => {
                                setIsMenuOpen(false)
                                setIsToursDropdownOpen(false)
                              }}
                            >
                              {city}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Link 
                  href="/events" 
                  className="block font-period font-bold text-lg text-rosewood dark:text-plaster hover:text-henna dark:hover:text-chartreuse transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Events
                </Link>
                <Link 
                  href="/about" 
                  className="block font-period font-bold text-lg text-rosewood dark:text-plaster hover:text-henna dark:hover:text-chartreuse transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Cart Slide-in Menu - 70% width on mobile */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-rosewood/50 dark:bg-grove/50 backdrop-blur-sm z-50"
              onClick={() => setIsCartOpen(false)}
            />

            {/* Cart Panel - 70% on mobile, 100% on desktop */}
            <motion.div
              id="cart-slide"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-[70%] sm:w-[60%] md:w-[50%] lg:w-[40%] xl:max-w-md bg-plaster dark:bg-grove shadow-2xl z-50 overflow-y-auto"
            >
              {/* Cart Header */}
              <div className="sticky top-0 bg-plaster dark:bg-grove border-b border-sand-dune dark:border-cypress p-4 flex items-center justify-between">
                <h2 className="font-period-narrow font-bold text-2xl text-rosewood dark:text-plaster">
                  Shopping Cart
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-sand-dune/30 dark:hover:bg-cypress/30 rounded-full transition-all duration-200 hover:scale-110"
                >
                  <X className="w-6 h-6 text-rosewood dark:text-plaster" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="p-4 space-y-4">
                {items.length === 0 ? (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <ShoppingBag className="w-16 h-16 text-sand-dune dark:text-cypress mx-auto mb-4" />
                    <p className="font-period text-lg text-rosewood/60 dark:text-plaster/60">
                      Your cart is empty
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 px-6 py-2 bg-cypress dark:bg-chartreuse text-plaster dark:text-grove rounded-lg hover:bg-cypress/90 dark:hover:bg-chartreuse/90 transition-all duration-200 hover:scale-105"
                    >
                      Start Shopping
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-3 bg-white/50 dark:bg-rosewood/50 rounded-lg border border-sand-dune dark:border-cypress hover:shadow-md transition-shadow duration-200"
                      >
                        {/* Item Image Placeholder */}
                        <div className="w-16 h-16 bg-sand-dune/30 dark:bg-cypress/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-6 h-6 text-sand-dune dark:text-cypress" />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-period font-semibold text-rosewood dark:text-plaster truncate">
                            {item.name}
                          </h4>
                          <p className="font-period text-sm text-henna dark:text-chartreuse">
                            ${item.price.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-sand-dune/30 dark:bg-cypress/30 rounded-full hover:bg-sand-dune/50 dark:hover:bg-cypress/50 transition-all duration-200 hover:scale-110"
                            >
                              <span className="text-rosewood dark:text-plaster">-</span>
                            </button>
                            <span className="font-period text-sm text-rosewood dark:text-plaster w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-sand-dune/30 dark:bg-cypress/30 rounded-full hover:bg-sand-dune/50 dark:hover:bg-cypress/50 transition-all duration-200 hover:scale-110"
                            >
                              <span className="text-rosewood dark:text-plaster">+</span>
                            </button>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-henna/10 rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0"
                        >
                          <X className="w-4 h-4 text-rosewood/40 dark:text-plaster/40 hover:text-henna dark:hover:text-poppy" />
                        </button>
                      </motion.div>
                    ))}

                    {/* Cart Footer */}
                    <div className="sticky bottom-0 bg-plaster dark:bg-grove border-t border-sand-dune dark:border-cypress p-4 space-y-3 -mx-4 px-4">
                      <div className="flex justify-between font-period text-lg">
                        <span className="text-rosewood/60 dark:text-plaster/60">Subtotal</span>
                        <span className="font-semibold text-rosewood dark:text-plaster">
                          ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <button className="w-full py-3 bg-cypress dark:bg-chartreuse text-plaster dark:text-grove rounded-lg hover:bg-cypress/90 dark:hover:bg-chartreuse/90 transition-all duration-200 hover:scale-[1.02] font-period font-semibold">
                        Checkout
                      </button>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="w-full py-2 text-center font-period text-sm text-rosewood/60 dark:text-plaster/60 hover:text-rosewood dark:hover:text-plaster transition-colors"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}