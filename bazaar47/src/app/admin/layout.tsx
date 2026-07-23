import { isAdminAuthenticated } from '@/lib/admin/auth'
import { redirect } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isAdminAuthenticated()) {
    redirect('/bazaar47/src/app/admin/login')
  }

  return <>{children}</>
}