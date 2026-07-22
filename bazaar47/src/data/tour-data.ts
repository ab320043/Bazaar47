import casselberry from '@/assets/casselberry.jpg'
import MAD from '@/assets/MAD.jpg'
import Jacks from '@/assets/newAssets/Jacks.png'
import dtGnv from '@/assets/dtGnv.jpg'
import Camp from '@/assets/Camp.jpg'
import howBazaar from '@/assets/howBazaar.jpg'
import { StaticImageData } from 'next/image'


export interface TourCity {
  id: string
  city: string
  arabicCity?: string
  date: string
  time: string
  venue: string
  address: string
  description: string
  price: string
  badge: string
  image: StaticImageData
  mapLink?: string
  ticketLink?: string
  venueDetails?: string
  highlights?: string[]
}

export const tourData: TourCity[] = [
  {
    id: 'orlando',
    city: 'Orlando',
    arabicCity: 'أورلاندو',
    date: 'Saturday, August 8',
    time: '6-10pm',
    venue: 'Casselberry Arts Center',
    address: '127 Quail Pond Cir, Casselberry, FL 32707',
    description: 'Kick off the Florida Tour at Casselberry Arts Center. A night of culture, community, and creative connection.',
    price: 'RSVP',
    badge: 'Free',
    image: casselberry,
    mapLink: 'https://maps.google.com/?q=Casselberry+Arts+Center+127+Quail+Pond+Cir+Casselberry+FL',
    ticketLink: '#',
    venueDetails: 'Casselberry Arts Center is a premier cultural venue featuring a beautiful gallery space and outdoor amphitheater. The center hosts various community events and art exhibitions throughout the year.',
    highlights: ['Live Music', 'Art Exhibitions', 'Local Vendors', 'Food Trucks'],
  },
  {
    id: 'south-florida',
    city: 'South Florida',
    arabicCity: 'جنوب فلوريدا',
    date: 'Saturday, September 12',
    time: '6-11pm',
    venue: 'MAD Arts',
    address: 'Broward County',
    description: "Experience the fusion of Palestinian heritage and South Florida's vibrant energy. A night to remember.",
    price: 'Buy Pre-Sales',
    badge: '$5-$10',
    image: MAD,
    mapLink: 'https://maps.google.com/?q=MAD+Arts+Broward+County',
    ticketLink: '#',
    venueDetails: 'MAD Arts is a cutting-edge cultural space in Broward County that showcases contemporary art and performance. The venue is known for its innovative programming and community engagement.',
    highlights: ['Live Performances', 'Art Installations', 'Local Artists', 'Night Market'],
  },
  {
    id: 'jacksonville',
    city: 'Jacksonville',
    arabicCity: 'جاكسونفيل',
    date: 'Saturday, October 7',
    time: '5-9pm',
    venue: 'Third Wednesday Art Walk',
    address: 'Downtown Jacksonville',
    description: 'Intimate gathering during the Art Walk with storytelling, traditional music, and community connection.',
    price: 'RSVP',
    badge: 'Free',
    image: Jacks,
    mapLink: 'https://maps.google.com/?q=Downtown+Jacksonville+Art+Walk',
    ticketLink: '#',
    venueDetails: 'The Third Wednesday Art Walk is a monthly event in Downtown Jacksonville that transforms the city streets into a vibrant arts and culture festival. Artists, musicians, and performers take over the streets.',
    highlights: ['Art Walk', 'Street Performers', 'Local Vendors', 'Cultural Exhibitions'],
  },
  {
    id: 'gainesville-fest',
    city: 'Gainesville | The Fest',
    arabicCity: 'غينزفيل - المهرجان',
    date: 'Saturday, October 24',
    time: '2-8pm',
    venue: 'Downtown, Gainesville',
    address: 'During The FEST',
    description: 'Join us during the FEST for an afternoon of culture, music, and community in the heart of Gainesville.',
    price: 'RSVP',
    badge: 'Free',
    image: dtGnv,
    mapLink: 'https://maps.google.com/?q=Downtown+Gainesville',
    ticketLink: 'https://thefestfl.com',
    venueDetails: 'The FEST is one of Gainesville\'s most anticipated annual events, bringing together artists, musicians, and creatives from across the region. Downtown Gainesville comes alive with art and culture.',
    highlights: ['The FEST Festival', 'Local Artists', 'Music', 'Community Gathering'],
  },
  {
    id: 'tampa',
    city: 'Tampa',
    arabicCity: 'تامبا',
    date: 'TBA',
    time: 'TBA',
    venue: 'TBA',
    address: 'TBA',
    description: 'A celebration of culture with food, music, and the warmth of community. Bring your family and friends.',
    price: 'Announcement Soon!',
    badge: 'Free',
    image: Camp ,
    mapLink: 'https://maps.google.com/?q=3012+W+Palmira+Ave+Tampa+FL',
    ticketLink: '#',
    venueDetails: 'CAMP Tampa is a unique community space that hosts events, workshops, and cultural gatherings. The venue is known for its welcoming atmosphere and commitment to community building.',
    highlights: ['Family Friendly', 'Live Music', 'Local Food', 'Community Workshops'],
  },
  {
    id: 'gainesville-finale',
    city: 'Gainesville',
    arabicCity: 'غينزفيل',
    date: 'Saturday, December 5',
    time: '5-10pm',
    venue: 'Bazaar47',
    address: '60 SW 2nd Street, Downtown Gainesville, FL 32601',
    description: 'Closing night where it all began. A heartfelt gathering under the stars to celebrate community and connection.',
    price: 'RSVP',
    badge: 'Free',
    image: howBazaar,
    mapLink: 'https://maps.google.com/?q=60+SW+2nd+Street+Gainesville+FL',
    ticketLink: '#',
    venueDetails: 'Bazaar47 is the home base and community space where it all started. This closing night celebration brings the Florida Tour full circle with a special gathering at the heart of the community.',
    highlights: ['Closing Celebration', 'Community Connection', 'Live Music', 'Special Guests'],
  },
]