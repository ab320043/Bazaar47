// app/events/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events at Bazaar47',
  description:
    "Everything happening at Bazaar47 — 60 SW 2nd Street, Gainesville, FL.",
  openGraph: {
    title: 'Events at Bazaar47',
    description:
      "Everything happening at Bazaar47 — 60 SW 2nd Street, Gainesville, FL.",
    url: 'https://bazaar47.com/events',
    siteName: 'Bazaar47',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events at Bazaar47',
    description:
      "Everything happening at Bazaar47 — 60 SW 2nd Street, Gainesville, FL.",
  },
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}