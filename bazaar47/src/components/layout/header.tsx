'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import BLACK from '@/assets/BLACK.svg'
import WHITE from '@/assets/WHITE.svg'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingBag, Menu, X } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useTheme } from 'next-themes'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { items, itemCount, removeItem, updateQuantity, totalPrice } = useCart()
  const { theme } = useTheme()

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
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="relative w-[120px] h-[40px]">
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
              </div>
            </Link>

            {/* Desktop Navigation - Bold & Larger */}
            <nav className="hidden md:flex items-center space-x-10">
              <Link 
                href="/shop" 
                className="font-period font-bold text-base text-rosewood/80 hover:text-rosewood transition-colors dark:text-plaster/80 dark:hover:text-plaster"
              >
                Shop
              </Link>
              <Link 
                href="/tours" 
                className="font-period font-bold text-base text-rosewood/80 hover:text-rosewood transition-colors dark:text-plaster/80 dark:hover:text-plaster"
              >
                Tours
              </Link>
              <Link 
                href="/events" 
                className="font-period font-bold text-base text-rosewood/80 hover:text-rosewood transition-colors dark:text-plaster/80 dark:hover:text-plaster"
              >
                Events
              </Link>
              <Link 
                href="/about" 
                className="font-period font-bold text-base text-rosewood/80 hover:text-rosewood transition-colors dark:text-plaster/80 dark:hover:text-plaster"
              >
                About
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:bg-sand-dune/30 rounded-full transition-colors dark:hover:bg-cypress/30"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-rosewood dark:text-plaster" />
              </button>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-sand-dune/30 rounded-full transition-colors dark:hover:bg-cypress/30"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5 text-rosewood dark:text-plaster" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-henna text-plaster text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-sand-dune/30 rounded-full transition-colors dark:hover:bg-cypress/30"
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

          {/* Expandable Search - Inline with header */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search Bazaar 47..."
                      className="w-full px-4 py-3 pl-12 bg-white/90 dark:bg-grove/90 border border-sand-dune dark:border-cypress rounded-lg focus:outline-none focus:ring-2 focus:ring-henna/40 dark:focus:ring-chartreuse/40 font-period text-rosewood dark:text-plaster placeholder:text-sand-dune dark:placeholder:text-cypress"
                      autoFocus
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-dune dark:text-cypress" />
                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sand-dune dark:text-cypress hover:text-rosewood dark:hover:text-plaster transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-plaster dark:bg-grove border-t border-sand-dune dark:border-cypress"
            >
              <nav className="container mx-auto px-4 py-6 space-y-4">
                <Link 
                  href="/shop" 
                  className="block font-period font-bold text-lg text-rosewood dark:text-plaster hover:text-henna dark:hover:text-chartreuse transition-colors"
                >
                  Shop
                </Link>
                <Link 
                  href="/tours" 
                  className="block font-period font-bold text-lg text-rosewood dark:text-plaster hover:text-henna dark:hover:text-chartreuse transition-colors"
                >
                  Tours
                </Link>
                <Link 
                  href="/events" 
                  className="block font-period font-bold text-lg text-rosewood dark:text-plaster hover:text-henna dark:hover:text-chartreuse transition-colors"
                >
                  Events
                </Link>
                <Link 
                  href="/about" 
                  className="block font-period font-bold text-lg text-rosewood dark:text-plaster hover:text-henna dark:hover:text-chartreuse transition-colors"
                >
                  About
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Cart Slide-in Menu */}
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

            {/* Cart Panel */}
            <motion.div
              id="cart-slide"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-plaster dark:bg-grove shadow-2xl z-50 overflow-y-auto"
            >
              {/* Cart Header */}
              <div className="sticky top-0 bg-plaster dark:bg-grove border-b border-sand-dune dark:border-cypress p-4 flex items-center justify-between">
                <h2 className="font-period-narrow font-bold text-2xl text-rosewood dark:text-plaster">
                  Shopping Cart
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-sand-dune/30 dark:hover:bg-cypress/30 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-rosewood dark:text-plaster" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="p-4 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-sand-dune dark:text-cypress mx-auto mb-4" />
                    <p className="font-period text-lg text-rosewood/60 dark:text-plaster/60">
                      Your cart is empty
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 px-6 py-2 bg-cypress dark:bg-chartreuse text-plaster dark:text-grove rounded-lg hover:bg-cypress/90 dark:hover:bg-chartreuse/90 transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 p-3 bg-white/50 dark:bg-rosewood/50 rounded-lg border border-sand-dune dark:border-cypress"
                      >
                        {/* Item Image Placeholder */}
                        <div className="w-16 h-16 bg-sand-dune/30 dark:bg-cypress/30 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-sand-dune dark:text-cypress" />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1">
                          <h4 className="font-period font-semibold text-rosewood dark:text-plaster">
                            {item.name}
                          </h4>
                          <p className="font-period text-sm text-henna dark:text-chartreuse">
                            ${item.price.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-sand-dune/30 dark:bg-cypress/30 rounded-full hover:bg-sand-dune/50 dark:hover:bg-cypress/50 transition-colors"
                            >
                              <span className="text-rosewood dark:text-plaster">-</span>
                            </button>
                            <span className="font-period text-sm text-rosewood dark:text-plaster w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-sand-dune/30 dark:bg-cypress/30 rounded-full hover:bg-sand-dune/50 dark:hover:bg-cypress/50 transition-colors"
                            >
                              <span className="text-rosewood dark:text-plaster">+</span>
                            </button>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-henna/10 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-rosewood/40 dark:text-plaster/40 hover:text-henna dark:hover:text-poppy" />
                        </button>
                      </motion.div>
                    ))}

                    {/* Cart Footer */}
                    <div className="sticky bottom-0 bg-plaster dark:bg-grove border-t border-sand-dune dark:border-cypress p-4 space-y-3">
                      <div className="flex justify-between font-period text-lg">
                        <span className="text-rosewood/60 dark:text-plaster/60">Subtotal</span>
                        <span className="font-semibold text-rosewood dark:text-plaster">
                          ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <button className="w-full py-3 bg-cypress dark:bg-chartreuse text-plaster dark:text-grove rounded-lg hover:bg-cypress/90 dark:hover:bg-chartreuse/90 transition-colors font-period font-semibold">
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