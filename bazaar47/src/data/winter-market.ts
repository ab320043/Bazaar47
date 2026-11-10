// data/winter-market.ts

export const WINTER_MARKET_DATES = [
  '2026-11-21', // Sat
  '2026-11-28', // Sat
  '2026-12-05', // Sat
  '2026-12-12', // Sat
  '2026-12-19', // Sat
  '2026-12-26', // Sat
  '2027-01-02', // Sat
] as const

export const MAX_VENDORS_PER_DAY = 40
export const VENDOR_FEE_PER_DAY = 40
export const VENUE_NAME = 'The Streatery in Downtown Gainesville'
export const VENUE_ADDRESS = '106 SW 1st Ave, Gainesville, FL 32601'
export const MARKET_HOURS = '4:00 PM – 10:00 PM'
export const HOLD_DURATION_MINUTES = 15

export const MARKET_COPY = {
  title: 'Downtown Winter Market Series',
  subtitle: 'Every Saturday · Nov 21 – Jan 2',
  intro:
    'A night market in the heart of Downtown Gainesville, every Saturday throughout the holiday season. Rotating vendors every week, live music and cozy vibes under the string lights.',
  about: [
    'The Downtown Winter Market Series returns to The Streatery for seven Saturdays of artisan vendors, live music, family-friendly activities, and community.',
    '40+ vendor booths each weekend featuring rotating local creators and handmade crafts. Hosted by Bazaar47 in partnership with Big: Culture & Arts Festival.',
    'The market series is sponsored by the City of Gainesville and the Gainesville Community Reinvestment Area (GCRA).'
  ],
  vendorPitch:
    'Apply to vend at one or more nights. Each night has 40+ spots. Fee is $40 per night. Tents, lights, and electricity are provided by Bazaar47.',
}