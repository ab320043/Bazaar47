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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 md:gap-x-6 lg:gap-x-8 xl:gap-x-12 2xl:gap-x-16 gap-y-8 md:gap-y-10 lg:gap-y-8">

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

          {/* Column 2 - Quote - FIXED: Now displays as a single block with left-to-right on mobile */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-col items-center md:items-start">
              <p className="font-host-grotesk text-[15px] md:text-[16px] lg:text-[18px] leading-[140%] text-[#D5C9B1] text-center md:text-left">
                A space for culture, community, and connection.
              </p>
              <div className="flex flex-col items-center md:items-start mt-1">
                <p className="font-host-grotesk text-[15px] md:text-[16px] lg:text-[18px] leading-[140%] text-[#D5C9B1] text-center md:text-left">
                  &ldquo;The warmth of gathering is the color of home&rdquo;
                </p>
                <p className="font-host-grotesk text-[14px] md:text-[15px] text-[#D5C9B1]/70 text-center md:text-left">
                  —Mahmoud Darwish
                </p>
              </div>
            </div>
          </div>

          {/* Column 3 - Florida Logo - FIXED: Better responsive sizing and aspect ratio */}
          <div className="col-span-2 md:col-span-1 flex justify-center md:justify-start">
            <div className="relative w-[140px] sm:w-[180px] md:w-[200px] lg:w-[220px] xl:w-[260px] 2xl:w-[300px]">
              <Image
                src={footerLogo2}
                alt="Florida Logo"
                width={300}
                height={150}
                className="w-full h-auto object-contain"
                priority
                quality={100}
                sizes="(max-width: 640px) 140px, (max-width: 768px) 180px, (max-width: 1024px) 200px, (max-width: 1280px) 220px, (max-width: 1536px) 260px, 300px"
              />
            </div>
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
                  Laila@bazaar47.com
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
                  href="https://www.instagram.com/bazaar_47?igsh=MTlzZDBydnpvbXRscg==" 
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
                  href="https://www.instagram.com/bigcaaf?igsh=MTcwbmF4MWpwNmJ5aw==" 
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