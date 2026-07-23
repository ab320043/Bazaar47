// src/app/admin/layout.tsx
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { redirect } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Check if the user is authenticated on the server
  if (!isAdminAuthenticated()) {
    // 2. If not, redirect immediately to the login page
    redirect('/admin/login')
  }

  // 3. If authenticated, render the child components (the dashboard)
  return <>{children}</>
}