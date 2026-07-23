import type { Metadata } from 'next'
import { Reem_Kufi, Host_Grotesk } from 'next/font/google'
import { Providers } from './providers'
import { Header } from '@/app/components/layout/header'
import { Footer } from '@/app/components/layout/footer'
import './globals.css'

const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-host-grotesk',
})

const reemKufi = Reem_Kufi({ 
  subsets: ['arabic'], 
  weight: '700',
  display: 'swap',
  variable: '--font-reem-kufi',
})

export const metadata: Metadata = {
  title: 'Bazaar47',
  icons: {
    icon: '/icons/favicon.ico',
  },
  openGraph: {
    title: 'Bazaar 47',
    description: 'Where Palestinian heritage meets Florida warmth — shop, tours, and community gatherings.',
    url: 'https://bazaar47.com',
    siteName: 'Bazaar 47',
    images: [
      {
        url: '/images/thumbnail.png',  // ← Your thumbnail image
        width: 1200,
        height: 630,
        alt: 'Bazaar 47',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className={`${hostGrotesk.variable} ${reemKufi.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Providers>
          <Header />
          <main className="pt-20">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}