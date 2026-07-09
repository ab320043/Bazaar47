import type { Metadata } from 'next'
import { Reem_Kufi } from 'next/font/google'
import { Providers } from './providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import './globals.css'

const reemKufi = Reem_Kufi({ 
  subsets: ['arabic'], 
  weight: '700',
  display: 'swap',
  variable: '--font-reem-kufi',
})

export const metadata: Metadata = {
  title: 'Bazaar 47',
  description: 'Where Palestinian heritage meets Florida warmth',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${reemKufi.variable}`}>
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