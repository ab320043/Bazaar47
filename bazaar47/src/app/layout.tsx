import type { Metadata } from 'next'
import { Reem_Kufi, Host_Grotesk } from 'next/font/google'
import { Providers } from './providers'
import { Header } from '@/app/components/layout/header'
import { Footer } from '@/app/components/layout/footer'
import { headers } from 'next/headers'
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
  },
  openGraph: {
    title: 'Bazaar 47',
    description: 'Where Palestinian heritage meets Florida warmth',
    url: 'https://bazaar47.com',
    siteName: 'Bazaar 47',
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
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if we're on an admin route
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isAdminRoute = pathname.startsWith('/admin')

  return (
    <html 
      lang="en" 
      className={`${hostGrotesk.variable} ${reemKufi.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Providers>
          {/* Only show Header if NOT on admin route */}
          {!isAdminRoute && <Header />}
          
          <main className={!isAdminRoute ? 'pt-20' : ''}>
            {children}
          </main>
          
          {/* Only show Footer if NOT on admin route */}
          {!isAdminRoute && <Footer />}
        </Providers>
      </body>
    </html>
  )
}