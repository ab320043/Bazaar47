import { Redis } from '@upstash/redis'
import fs from 'fs'
import path from 'path'

// Initialize Redis client
const redis = Redis.fromEnv()

const KV_KEY = 'submissions'
const DATA_FILE = path.join(process.cwd(), 'data', 'submissions.json')

export async function getSubmissions() {
  // In production, use Upstash Redis
  if (process.env.VERCEL) {
    try {
      const submissions = await redis.get(KV_KEY)
      return submissions || []
    } catch (error) {
      console.error('Redis get error:', error)
      return []
    }
  }
  
  // In development, use JSON file
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return []
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function saveSubmissions(submissions: unknown[]) {
  if (process.env.VERCEL) {
    try {
      await redis.set(KV_KEY, submissions)
    } catch (error) {
      console.error('Redis set error:', error)
    }
  } else {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2))
    } catch (error) {
      console.error('File write error:', error)
    }
  }
}