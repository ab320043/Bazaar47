import type { Metadata } from 'next'
import { Reem_Kufi, Host_Grotesk } from 'next/font/google'
import { Providers } from './providers'
import { Header } from '@/app/components/layout/header'
import { Footer } from '@/app/components/layout/footer'
import { headers } from 'next/headers'
import { IosInstallPrompt } from '@/app/components/pwa/ios-install-prompt'
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
  title: 'Bazaar 47',
  description: 'Where Palestinian heritage meets Florida warmth',
  icons: {
    icon: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Bazaar47',
    description: 'Where Palestinian heritage meets Florida warmth',
    url: 'https://bazaar47.com',
    siteName: 'Bazaar47',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  manifest: '/manifest.webmanifest',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isAppRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/big-caf-meetings-calendar') ||
    pathname.startsWith('/reopening') ||
    pathname.startsWith('/open-mic')

  return (
    <html 
      lang="en" 
      className={`${hostGrotesk.variable} ${reemKufi.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="application-name" content="Bazaar47" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bazaar47" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#341B1C" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {!isAppRoute && <Header />}
          <main className={!isAppRoute ? 'pt-20' : ''}>
            {children}
          </main>
          {!isAppRoute && <Footer />}
          {!isAppRoute && <IosInstallPrompt />}
        </Providers>
      </body>
    </html>
  )
}