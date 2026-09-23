import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Big Caf Festival — Meeting Availability',
  description: 'Pick the days and times you are available to meet with us.',
  openGraph: {
    title: 'Big Caf Festival — Meeting Availability',
    description: 'Pick the days and times you are available to meet with us.',
    url: 'https://bazaar47.com/big-caf-meetings-calendar',
    siteName: 'Bazaar47',
    type: 'website',
    images: [
      {
        url: '/images/big-caf-meetings-og.jpeg', // or any image you want
        width: 1200,
        height: 630,
        alt: 'Big Caf Festival — Meeting Availability',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Big Caf Festival — Meeting Availability',
    description: 'Pick the days and times you are available to meet with us.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}