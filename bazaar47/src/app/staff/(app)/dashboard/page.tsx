// app/staff/(app)/dashboard/page.tsx
import { redirect } from 'next/navigation'

export default function StaffDashboardRedirect() {
  redirect('/staff/shifts')
}