// data/winter-market.ts

export const WINTER_MARKET_DATES = [
  '2026-11-21', '2026-11-22', // Fri, Sat
  '2026-11-27', '2026-11-28',
  '2026-12-04', '2026-12-05',
  '2026-12-11', '2026-12-12',
  '2026-12-18', '2026-12-19',
] as const

export const MAX_VENDORS_PER_DAY = 26
export const VENDOR_FEE_PER_DAY = 35
export const VENUE_NAME = 'The Streatery'
export const VENUE_ADDRESS = '106 SW 1st Ave, Gainesville, FL 32601'
export const MARKET_HOURS = '4:00 PM – 10:00 PM'
export const HOLD_DURATION_MINUTES = 15

export const MARKET_COPY = {
  title: 'Downtown Winter Market',
  subtitle: 'Fridays & Saturdays · Nov 21 – Dec 19',
  intro:
    'A night market in the heart of downtown Gainesville. 26 rotating vendor booths, live music, and cozy holiday vibes under the string lights.',
  about: [
    'The Downtown Winter Market Series returns to The Streatery for five weekends of artisan vendors, live music, wellness spaces, and community.',
    'Around 26 booths each night feature rotating local merchants, vintage clothing, and handmade crafts. Hosted by Bazaar47 in partnership with Big: Culture & Arts Festival (Big CAAF).',
  ],
  vendorPitch:
    'Apply to vend at one or more nights. Each night has 26 spots. Fee is $35 per night. Tables, tents, and electricity available on request.',
}