import { cookies } from 'next/headers'

const SESSION_KEY = 'admin_session'
const SESSION_VALUE = 'authenticated'

export async function setAdminSession() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_KEY, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_KEY)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_KEY)
  return session?.value === SESSION_VALUE
}