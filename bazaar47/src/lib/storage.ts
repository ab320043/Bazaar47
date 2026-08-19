import { Redis } from '@upstash/redis'
import fs from 'fs'
import path from 'path'

// Initialize Redis client
const redis = Redis.fromEnv()

const KV_KEY = 'submissions'
const DATA_FILE = path.join(process.cwd(), 'data', 'submissions.json')

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0) {
      console.log(`Retry operation... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return retryOperation(operation, retries - 1)
    }
    throw error
  }
}

export async function getSubmissions() {
  // In production, use Upstash Redis with retry logic
  if (process.env.VERCEL) {
    try {
      const submissions = await retryOperation(() => redis.get(KV_KEY))
      return submissions || []
    } catch (error) {
      console.error('Redis get error after retries:', error)
      throw new Error('Failed to fetch submissions from storage')
    }
  }

  // In development, use JSON file
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return []
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('File read error:', error)
    throw new Error('Failed to read submissions from file')
  }
}

export async function saveSubmissions(submissions: unknown[]) {
  if (process.env.VERCEL) {
    try {
      await retryOperation(() => redis.set(KV_KEY, submissions))
    } catch (error) {
      console.error('Redis set error after retries:', error)
      throw new Error('Failed to save submissions to storage')
    }
  } else {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(DATA_FILE)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2))
    } catch (error) {
      console.error('File write error:', error)
      throw new Error('Failed to save submissions to file')
    }
  }
}