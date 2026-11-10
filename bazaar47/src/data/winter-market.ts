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

export const MAX_VENDORS_PER_DAY = 26
export const VENDOR_FEE_PER_DAY = 40
export const VENUE_NAME = 'The Streatery'
export const VENUE_ADDRESS = '106 SW 1st Ave, Gainesville, FL 32601'
export const MARKET_HOURS = '4:00 PM – 10:00 PM'
export const HOLD_DURATION_MINUTES = 15

export const MARKET_COPY = {
  title: 'Downtown Winter Market',
  subtitle: 'Saturdays · Nov 21 – Jan 2',
  intro:
    'A night market in the heart of downtown Gainesville. 26 rotating vendor booths, live music, and cozy holiday vibes under the string lights.',
  about: [
    'The Downtown Winter Market Series returns to The Streatery for seven Saturdays of artisan vendors, live music, wellness spaces, and community.',
    'Around 26 booths each night feature rotating local merchants, vintage clothing, and handmade crafts. Hosted by Bazaar47 in partnership with Big: Culture & Arts Festival (Big CAAF).',
  ],
  vendorPitch:
    'Apply to vend at one or more nights. Each night has 26 spots. Fee is $40 per night. Tables, tents, and electricity available on request.',
}