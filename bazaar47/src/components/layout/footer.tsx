import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-rosewood text-plaster py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-period-narrow font-bold text-2xl mb-4">
              BAZAAR 47
            </h3>
            <p className="font-period text-sm text-plaster/60">
              Where Palestinian heritage meets Florida warmth.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-period font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="font-period text-sm text-plaster/60 hover:text-plaster transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/tours" className="font-period text-sm text-plaster/60 hover:text-plaster transition-colors">
                  Tours
                </Link>
              </li>
              <li>
                <Link href="/events" className="font-period text-sm text-plaster/60 hover:text-plaster transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/about" className="font-period text-sm text-plaster/60 hover:text-plaster transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-period font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 font-period text-sm text-plaster/60">
                <Mail className="w-4 h-4" />
                info@bazaar47.com
              </li>
              <li className="flex items-center gap-2 font-period text-sm text-plaster/60">
                <Phone className="w-4 h-4" />
                (123) 456-7890
              </li>
              <li className="flex items-center gap-2 font-period text-sm text-plaster/60">
                <MapPin className="w-4 h-4" />
                Florida, USA
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-period font-semibold mb-4">Follow Us</h4>
            <Link
              href="https://instagram.com/bazaar47"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-period text-sm text-plaster/60 hover:text-plaster transition-colors"
            >
              {/* {/* <Instagram className="w-5 h-5" /> */}
              @bazaar47
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-rosewood/30 text-center font-period text-sm text-plaster/40">
          © 2026 Bazaar 47. All rights reserved.
        </div>
      </div>
    </footer>
  )
}