import { cookies } from 'next/headers'

export const ADMIN_SESSION_KEY = 'admin_session'

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.has(ADMIN_SESSION_KEY)
}

export async function setAdminSession() {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_KEY, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_KEY)
}