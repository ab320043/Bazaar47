'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import footerLogo from '@/assets/newAssets/footerLogo.png'
import footerLogo2 from '@/assets/newAssets/footerLogo2.png'
import CustomPhoneIcon from '@/assets/newAssets/CustomePhoneIcon.png'
import CustomEmailIcon from '@/assets/newAssets/CustomEmailIcon.png'
import CustomLocationIcon from '@/assets/newAssets/CustomLocationIcon.png'
import CustomInstagramIcon from '@/assets/newAssets/CustomInstagramIcon.png'

// Custom icons
const MailIcon = () => (
  <Image
    src={CustomEmailIcon}
    alt="Email"
    width={18}
    height={18}
    priority
  /> 
)

const PhoneIcon = () => (
  <Image
    src={CustomPhoneIcon}
    alt="Phone"
    width={18}
    height={18}
    priority
  />
)

const LocationIcon = () => (
  <Image
    src={CustomLocationIcon}
    alt="Location"
    width={18}
    height={18}
    priority
  />
)

const InstagramIcon = () => (
  <Image
    src={CustomInstagramIcon}
    alt="Instagram"
    width={18}
    height={18}
    priority
  />
)

export function Footer() {
  const pathname = usePathname()

  // ============================================
  // HANDLE NAV CLICK - Navigate and scroll to section
  // ============================================
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>, 
    sectionId: string,
    href: string
  ) => {
    e.preventDefault()

    // If we're not on the homepage, navigate to homepage first
    if (pathname !== '/') {
      window.location.href = href
      return
    }

    // If we're on the homepage, just scroll to the section
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-[#341B1C] text-[#D5C9B1]">
      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16">

        {/* ============================================
            MAIN FOOTER - Responsive Grid Layout
            Mobile: 2 columns, stacked rows
            Tablet: 3 columns
            Desktop: 6 columns in one row
            ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-10 lg:gap-8">

          {/* Column 1 - Logo */}
          <div className="col-span-2 md:col-span-1 flex justify-center md:justify-start">
            <Link href="/">
              <Image
                src={footerLogo}
                alt="Bazaar 47"
                width={128}
                height={45}
                className="w-[120px] md:w-[128px] h-auto hover:opacity-80 transition-opacity"
                priority
              />
            </Link>
          </div>

          {/* Column 2 - Quote */}
          <div className="col-span-2 md:col-span-1">
            <p className="font-host-grotesk text-[15px] md:text-[16px] text-center md:text-left lg:text-[18px] leading-[140%] text-[#D5C9B1]">
              A space for culture,
              <br />
              community, and connection.
            </p>
            <p className="mt-4 font-host-grotesk text-[15px] text-center md:text-[16px] md:text-left lg:text-[18px] leading-[140%] text-[#D5C9B1]">
              The warmth of gathering is
              <br />
              the color of home
            </p>
            <p className="mt-2 font-host-grotesk text-[14px] text-center md:text-[15px] md:text-left text-[#D5C9B1]/70">
              —Mahmoud Darwish
            </p>
          </div>

          {/* Column 3 - Florida Logo */}
          <div className="col-span-2 md:col-span-1 flex justify-center md:justify-start">
            <Image
              src={footerLogo2}
              alt="Florida Logo"
              className="w-[120px] md:w-[220px] h-auto"
              priority
            />
          </div>

          {/* Column 4 - Explore */}
          <div className="col-span-1">
            <h4 className="font-host-grotesk font-semibold text-[15px] md:text-[16px] lg:text-[18px] text-[#D5C9B1] mb-3 md:mb-4">
              Explore
            </h4>
            <div className="flex flex-col gap-2 md:gap-3">
              <Link
                href="/#about"
                onClick={(e) => handleNavClick(e, 'about', '/#about')}
                className="font-host-grotesk text-[13px] md:text-[14px] lg:text-[16px] text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors cursor-pointer"
              >
                About
              </Link>

              <Link
                href="/#tickets"
                onClick={(e) => handleNavClick(e, 'tickets', '/#tickets')}
                className="font-host-grotesk text-[13px] md:text-[14px] lg:text-[16px] text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors cursor-pointer"
              >
                Tickets
              </Link>

              <Link 
                href="/vendors" 
                className="font-host-grotesk text-[13px] md:text-[14px] lg:text-[16px] text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors"
              >
                Vendors
              </Link>
            </div>
          </div>

          {/* Column 5 - Contact */}
          <div className="col-span-1">
            <h4 className="font-host-grotesk font-semibold text-[15px] md:text-[16px] lg:text-[18px] text-[#D5C9B1] mb-3 md:mb-4">
              Contact
            </h4>
            <div className="flex flex-col gap-2 md:gap-3">
              <div className="flex items-center gap-2 md:gap-3">
                <MailIcon />
                <span className="font-host-grotesk text-[13px] md:text-[14px] lg:text-[16px] text-[#D5C9B1]/70">
                  info@bazaar47.com
                </span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <PhoneIcon />
                <span className="font-host-grotesk text-[13px] md:text-[14px] lg:text-[16px] text-[#D5C9B1]/70">
                  (352) 266-1267
                </span>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <LocationIcon />
                <span className="font-host-grotesk text-[13px] md:text-[14px] lg:text-[16px] text-[#D5C9B1]/70 leading-[140%]">
                  60 SW 2nd Street
                  <br />
                  Gainesville, FL 32601
                </span>
              </div>
            </div>
          </div>

          {/* Column 6 - Stay Connected */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-host-grotesk font-semibold text-[15px] md:text-[16px] lg:text-[18px] text-[#D5C9B1] mb-3 md:mb-4">
              Stay Connected
            </h4>
            <p className="font-host-grotesk text-[13px] md:text-[14px] lg:text-[16px] text-[#D5C9B1]/60 leading-[140%] mb-3 md:mb-4">
              Follow us for updates on tours,
              events, and community gatherings.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <InstagramIcon />
                <Link 
                  href="https://instagram.com/bazaar47" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-host-grotesk text-[13px] md:text-[14px] lg:text-[16px] text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors"
                >
                  @bazaar47
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <InstagramIcon />
                <Link 
                  href="https://instagram.com/bigcaaf" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-host-grotesk text-[13px] md:text-[14px] lg:text-[16px] text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors"
                >
                  @bigcaaf
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================
            BOTTOM COPYRIGHT
            ============================================ */}
        <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-[#D5C9B1]/10 text-center md:text-left">
          <p className="font-host-grotesk text-[11px] md:text-[12px] text-[#D5C9B1]/50">
            © 2026 Bazaar 47. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  )
}