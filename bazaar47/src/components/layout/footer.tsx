import Link from 'next/link'
import Image from 'next/image'
import { Mail, MapPin, Phone, ArrowUp } from 'lucide-react'
import WHITE from '@/assets/WHITE.svg'

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-rosewood text-plaster relative overflow-hidden">
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="#EFEADE" />
              <circle cx="30" cy="30" r="2" fill="#FFB0BC" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        
        {/* Top Section - Logo + Back to Top */}
        <div className="flex justify-between items-start mb-12">
          <div className="relative w-[140px] h-[50px]">
            <Image
              src={WHITE}
              alt="Bazaar 47"
              fill
              className="object-contain"
              priority
            />
          </div>
          {/* <button
            onClick={scrollToTop}
            className="hidden md:flex items-center gap-2 text-plaster/30 hover:text-plaster/60 transition-colors group"
          >
            <span className="font-period text-xs tracking-widest uppercase">Back to top</span>
            <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
          </button> */}
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 pb-12 border-b border-plaster/10">
          
          {/* Brand - Social */}
          <div className="space-y-4">
            <p className="font-period text-sm text-plaster/40 leading-relaxed max-w-xs">
              A space for culture, community, and connection.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="https://instagram.com/the.how.bazar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-plaster/30 hover:text-plaster/60 transition-colors"
                aria-label="Instagram"
              >
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-period-narrow font-bold text-sm text-plaster/60 uppercase tracking-widest mb-4">
              Explore
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/tours" 
                  className="font-period text-sm text-plaster/40 hover:text-plaster transition-colors group flex items-center gap-2"
                >
                  <span className="w-3 h-px bg-plaster/20 group-hover:bg-plaster/60 transition-all" />
                  Tours
                </Link>
              </li>
              <li>
                <Link 
                  href="/events" 
                  className="font-period text-sm text-plaster/40 hover:text-plaster transition-colors group flex items-center gap-2"
                >
                  <span className="w-3 h-px bg-plaster/20 group-hover:bg-plaster/60 transition-all" />
                  Events
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="font-period text-sm text-plaster/40 hover:text-plaster transition-colors group flex items-center gap-2"
                >
                  <span className="w-3 h-px bg-plaster/20 group-hover:bg-plaster/60 transition-all" />
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-period-narrow font-bold text-sm text-plaster/60 uppercase tracking-widest mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 font-period text-sm text-plaster/40 hover:text-plaster/60 transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>info@bazaar47.com</span>
              </li>
              <li className="flex items-center gap-3 font-period text-sm text-plaster/40 hover:text-plaster/60 transition-colors">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>(352) 266-1267</span>
              </li>
              <li className="flex items-center gap-3 font-period text-sm text-plaster/40 hover:text-plaster/60 transition-colors">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Gainesville, FL</span>
              </li>
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div>
            <h4 className="font-period-narrow font-bold text-sm text-plaster/60 uppercase tracking-widest mb-4">
              Stay Connected
            </h4>
            <p className="font-period text-sm text-plaster/30 mb-4 leading-relaxed">
              Follow us for updates on tours, events, and community gatherings.
            </p>
            <Link
              href="https://instagram.com/the.how.bazar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-period text-sm text-chartreuse/60 hover:text-chartreuse transition-colors group"
            >
              <span className="w-6 h-px bg-chartreuse/30 group-hover:bg-chartreuse/60 transition-all" />
              @the.how.bazar
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-period text-xs text-plaster/20 tracking-wider">
            © 2026 Bazaar 47. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-plaster/20 font-period text-xs tracking-wider">
            <span>✦</span>
            <span>Florida Tour 2026</span>
            <span>✦</span>
          </div>
        </div>
      </div>
    </footer>
  )
}