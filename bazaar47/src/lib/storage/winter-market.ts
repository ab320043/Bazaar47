// lib/storage/winter-market.ts
import { Redis } from '@upstash/redis'
import type { WinterMarketApplication } from '@/types/winter-market'

const redis = Redis.fromEnv()
const APPLICATIONS_KEY = 'winter_market_applications'

type ApplicationsMap = Record<string, WinterMarketApplication>

async function getMap(): Promise<ApplicationsMap> {
  try {
    const raw = await redis.get(APPLICATIONS_KEY)
    return (raw as ApplicationsMap) || {}
  } catch (error) {
    console.error('Redis get error (winter_market_applications):', error)
    return {}
  }
}

async function saveMap(map: ApplicationsMap): Promise<void> {
  try {
    await redis.set(APPLICATIONS_KEY, map)
  } catch (error) {
    console.error('Redis set error (winter_market_applications):', error)
    throw new Error('Failed to save winter market applications')
  }
}

export async function getAllApplications(): Promise<WinterMarketApplication[]> {
  const map = await getMap()
  return Object.values(map)
}

export async function getApplicationById(
  id: string
): Promise<WinterMarketApplication | undefined> {
  const map = await getMap()
  return map[id]
}

export async function getApplicationsByPaymentIntentId(
  paymentIntentId: string
): Promise<WinterMarketApplication | undefined> {
  const map = await getMap()
  return Object.values(map).find((a) => a.stripePaymentIntentId === paymentIntentId)
}

export async function createApplication(
  input: Omit<WinterMarketApplication, 'id' | 'createdAt' | 'updatedAt'>
): Promise<WinterMarketApplication> {
  const map = await getMap()
  const now = new Date().toISOString()
  const application: WinterMarketApplication = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  map[application.id] = application
  await saveMap(map)
  return application
}

export async function updateApplication(
  id: string,
  updates: Partial<WinterMarketApplication>
): Promise<WinterMarketApplication | undefined> {
  const map = await getMap()
  const existing = map[id]
  if (!existing) return undefined
  const updated: WinterMarketApplication = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  map[id] = updated
  await saveMap(map)
  return updated
}

export async function deleteApplication(id: string): Promise<boolean> {
  const map = await getMap()
  if (!(id in map)) return false
  delete map[id]
  await saveMap(map)
  return true
}

/**
 * Count how many spots are occupied on a given date.
 * A spot is occupied if:
 *   - paymentStatus === 'paid', OR
 *   - paymentStatus === 'pending' AND holdExpiresAt is in the future
 *
 * Expired pending applications do NOT count.
 */
export function countOccupiedSpots(
  applications: WinterMarketApplication[],
  date: string,
  now = Date.now()
): number {
  return applications.filter((a) => {
    if (!a.selectedDates.includes(date)) return false
    if (a.paymentStatus === 'paid') return true
    if (a.paymentStatus === 'pending' && a.holdExpiresAt) {
      return new Date(a.holdExpiresAt).getTime() > now
    }
    return false
  }).length
}