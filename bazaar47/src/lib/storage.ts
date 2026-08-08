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
    // NOTE: intentionally no try/catch swallowing here. A failed read must
    // throw, not silently return []. Returning [] on a Redis hiccup makes a
    // failed read indistinguishable from "there are genuinely zero
    // submissions" — and if the caller then pushes a new submission onto
    // that empty array and saves it back, it permanently wipes every
    // previous submission. Let the API route's catch block handle this.
    const submissions = await redis.get(KV_KEY)
    return submissions || []
  }

  // In development, use JSON file
  if (!fs.existsSync(DATA_FILE)) {
    return []
  }
  const content = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(content)
}

export async function saveSubmissions(submissions: unknown[]) {
  if (process.env.VERCEL) {
    // Same reasoning: let a failed write throw instead of swallowing it, so
    // the save route's catch block returns a real error instead of telling
    // the person "success" for data that was never persisted.
    await redis.set(KV_KEY, submissions)
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2))
  }
}