'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import Bazaar47LogoNumber from '@/assets/newAssets/Bazaar47LogoNumber.png'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { items, itemCount, removeItem, updateQuantity, totalPrice } = useCart()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const [targetSection, setTargetSection] = useState<string | null>(null)

  useEffect(() => {
    if (targetSection) {
      window.location.href = `/#${targetSection}`
    }
  }, [targetSection])

  // ============================================
  // HANDLE NAV CLICK - Navigate and scroll to section
  // ============================================
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault()
    setIsMenuOpen(false)

    // If we're not on the homepage, navigate to homepage first
    if (pathname !== '/') {
      setTargetSection(sectionId)
      return
    }

    // If we're on the homepage, just scroll to the section
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Navigation links configuration
  const navLinks = [
    { 
      label: 'About', 
      href: '/#about',
      sectionId: 'about'
    },
    { 
      label: 'Tickets', 
      href: '/#tickets',
      sectionId: 'tickets'
    },
    { 
      label: 'Vendors', 
      href: '/vendors',
      sectionId: null
    },
  ]

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out
          ${isScrolled ? 'bg-plaster/95 backdrop-blur-sm shadow-md' : 'bg-plaster'}
        `}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo - Left */}
            <Link href="/" className="flex-shrink-0">
              <motion.div 
                className="relative"
                style={{
                  width: '59.28px',
                  height: '42.44px',
                }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src={Bazaar47LogoNumber}
                  alt="Bazaar 47"
                  fill
                  className="object-contain"
                  priority
                />
              </motion.div>
            </Link>

            {/* Center Navigation - Desktop */}
            <nav className="hidden md:flex items-center justify-center flex-1 space-x-12">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  {link.sectionId ? (
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.sectionId!)}
                      className="font-host-grotesk font-bold text-base text-rosewood/70 hover:text-rosewood transition-all duration-300 hover:scale-105 relative group cursor-pointer"
                    >
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-chartreuse transition-all duration-300 group-hover:w-full" />
                    </a>
                  ) : (
                    <Link 
                      href={link.href}
                      className="font-host-grotesk font-bold text-base text-rosewood/70 hover:text-rosewood transition-all duration-300 hover:scale-105 relative group"
                    >
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-chartreuse transition-all duration-300 group-hover:w-full" />
                    </Link>
                  )}
                </motion.div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-sand-dune/30 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Cart"
                whileTap={{ scale: 0.9 }}
              >
                <ShoppingBag className="w-5 h-5 text-rosewood" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-henna text-plaster text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </motion.button>

              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-sand-dune/30 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Menu"
                whileTap={{ scale: 0.9 }}
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-rosewood" />
                ) : (
                  <Menu className="w-5 h-5 text-rosewood" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden bg-plaster border-t border-sand-dune/30"
            >
              <motion.nav 
                className="container mx-auto px-6 py-8 space-y-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    {link.sectionId ? (
                      <a
                        href={link.href}
                        onClick={(e) => handleNavClick(e, link.sectionId!)}
                        className="block font-host-grotesk-narrow font-bold text-3xl text-rosewood hover:text-henna transition-colors duration-300 cursor-pointer"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link 
                        href={link.href}
                        className="block font-host-grotesk-narrow font-bold text-3xl text-rosewood hover:text-henna transition-colors duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    )}
                  </motion.div>
                ))}
                
                <div className="pt-4 mt-4 border-t border-sand-dune/30">
                  <p className="font-host-grotesk text-sm text-rosewood/40">Bazaar 47</p>
                  <p className="font-host-grotesk text-xs text-rosewood/20 mt-1">Florida Tour 2026</p>
                </div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Cart Slide-in Menu */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-rosewood/50 backdrop-blur-sm z-50"
              onClick={() => setIsCartOpen(false)}
            />

            <motion.div
              id="cart-slide"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-[85%] sm:w-[70%] md:w-[50%] lg:w-[40%] xl:max-w-md bg-plaster shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-plaster border-b border-sand-dune/30 p-4 flex items-center justify-between">
                <h2 className="font-host-grotesk-narrow font-bold text-2xl text-rosewood">
                  Shopping Cart
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-sand-dune/30 rounded-full transition-all duration-300 hover:scale-110"
                >
                  <X className="w-6 h-6 text-rosewood" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {items.length === 0 ? (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <ShoppingBag className="w-16 h-16 text-sand-dune mx-auto mb-4" />
                    <p className="font-host-grotesk text-lg text-rosewood/60">
                      Your cart is empty
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 px-6 py-2 bg-cypress text-plaster rounded-lg hover:bg-cypress/90 transition-all duration-300 hover:scale-105"
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
                        className="flex items-center gap-4 p-3 bg-white/50 rounded-lg border border-sand-dune/30 hover:shadow-md transition-shadow duration-300"
                      >
                        <div className="w-16 h-16 bg-sand-dune/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-6 h-6 text-sand-dune" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-host-grotesk font-semibold text-rosewood truncate">
                            {item.name}
                          </h4>
                          <p className="font-host-grotesk text-sm text-henna">
                            ${item.price.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-sand-dune/30 rounded-full hover:bg-sand-dune/50 transition-all duration-300 hover:scale-110"
                            >
                              <span className="text-rosewood">-</span>
                            </button>
                            <span className="font-host-grotesk text-sm text-rosewood w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-sand-dune/30 rounded-full hover:bg-sand-dune/50 transition-all duration-300 hover:scale-110"
                            >
                              <span className="text-rosewood">+</span>
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-henna/10 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0"
                        >
                          <X className="w-4 h-4 text-rosewood/40 hover:text-henna" />
                        </button>
                      </motion.div>
                    ))}

                    <div className="sticky bottom-0 bg-plaster border-t border-sand-dune/30 p-4 space-y-3 -mx-4 px-4">
                      <div className="flex justify-between font-host-grotesk text-lg">
                        <span className="text-rosewood/60">Subtotal</span>
                        <span className="font-semibold text-rosewood">
                          ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <button className="w-full py-3 bg-cypress text-plaster rounded-lg hover:bg-cypress/90 transition-all duration-300 hover:scale-[1.02] font-host-grotesk font-semibold">
                        Checkout
                      </button>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="w-full py-2 text-center font-host-grotesk text-sm text-rosewood/60 hover:text-rosewood transition-colors"
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