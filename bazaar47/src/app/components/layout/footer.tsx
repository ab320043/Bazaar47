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
            MAIN FOOTER - 6 Columns in One Row
            ============================================ */}
        <div className="flex flex-wrap lg:flex-nowrap items-start justify-between gap-8 md:gap-10 lg:gap-12">
          
          {/* Column 1 - Logo */}
          <div className="shrink-0 min-w-[100px]">
            <Link href="/">
              <Image
                src={footerLogo}
                alt="Bazaar 47"
                width={128}
                height={45}
                className="w-[100px] md:w-[128px] h-auto hover:opacity-80 transition-opacity"
                priority
              />
            </Link>
          </div>

          {/* Column 2 - Quote */}
          <div className="max-w-[200px] md:max-w-[230px] lg:max-w-[260px] shrink-0">
            <p className="font-host-grotesk text-[16px] md:text-[18px] leading-[108%] text-[#D5C9B1]">
              A space for culture,
              <br />
              community, and connection.
            </p>
            <p className="mt-4 md:mt-5 font-host-grotesk text-[16px] md:text-[18px] leading-[108%] text-[#D5C9B1]">
              “The warmth of gathering is
              <br />
              the color of home”
            </p>
            <p className="mt-3 md:mt-4 font-host-grotesk text-[16px] md:text-[18px] leading-[108%] text-[#D5C9B1]">
              —Mahmoud Darwish
            </p>
          </div>

          {/* Column 3 - Florida Logo */}
          <div className="shrink-0" style={{ width: '150px' }}>
            <Image
              src={footerLogo2}
              alt="Florida Logo"
              priority
            />
          </div>

          {/* Column 4 - Explore */}
          <div className="shrink-0">
            <h4 className="font-host-grotesk font-semibold text-[16px] md:text-[18px] text-[#D5C9B1] mb-3 md:mb-4">
              Explore
            </h4>
            <div className="flex flex-col gap-2 md:gap-3">
              {/* About - scrolls to section */}
              <Link
                href="/#about"
                onClick={(e) => handleNavClick(e, 'about', '/#about')}
                className="font-host-grotesk text-[14px] md:text-[16px] text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors cursor-pointer"
              >
                About
              </Link>
              
              {/* Tickets - scrolls to section */}
              <Link
                href="/#tickets"
                onClick={(e) => handleNavClick(e, 'tickets', '/#tickets')}
                className="font-host-grotesk text-[14px] md:text-[16px] text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors cursor-pointer"
              >
                Tickets
              </Link>
              
              {/* Vendors - goes to page */}
              <Link 
                href="/vendors" 
                className="font-host-grotesk text-[14px] md:text-[16px] text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors"
              >
                Vendors
              </Link>
            </div>
          </div>

          {/* Column 5 - Contact */}
          <div className="shrink-0 max-w-[180px] md:max-w-[210px]">
            <h4 className="font-host-grotesk font-semibold text-[16px] md:text-[18px] text-[#D5C9B1] mb-3 md:mb-4">
              Contact
            </h4>
            <div className="flex flex-col gap-2 md:gap-3">
              <div className="flex items-center gap-2 md:gap-3">
                <MailIcon />
                <span className="font-host-grotesk text-[14px] md:text-[16px] text-[#D5C9B1]/70">
                  info@bazaar47.com
                </span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <PhoneIcon />
                <span className="font-host-grotesk text-[14px] md:text-[16px] text-[#D5C9B1]/70">
                  (352) 266-1267
                </span>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <LocationIcon />
                <span className="font-host-grotesk text-[14px] md:text-[16px] text-[#D5C9B1]/70 leading-[140%]">
                  60 SW 2nd Street
                  <br />
                  Gainesville, FL 32601
                </span>
              </div>
            </div>
          </div>

          {/* Column 6 - Stay Connected */}
          <div className="shrink-0 max-w-[200px] md:max-w-[230px]">
            <h4 className="font-host-grotesk font-semibold text-[16px] md:text-[18px] text-[#D5C9B1] mb-3 md:mb-4">
              Stay Connected
            </h4>
            <p className="font-host-grotesk text-[14px] md:text-[16px] text-[#D5C9B1]/60 leading-[120%] mb-3 md:mb-4">
              Follow us for updates on tours,
              events, and community gatherings.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <InstagramIcon />
                  <Link 
                    href="https://instagram.com/bazaar47" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-host-grotesk text-[14px] md:text-[16px] text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors"
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
                    className="font-host-grotesk text-[14px] md:text-[16px] text-[#D5C9B1]/70 hover:text-[#D5C9B1] transition-colors"
                  >
                    @bigcaaf
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================
            BOTTOM COPYRIGHT
            ============================================ */}
        <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-[#D5C9B1]/10">
          <p className="font-host-grotesk text-[11px] md:text-[12px] text-[#D5C9B1]/50">
            © 2026 Bazaar 47. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  )
}