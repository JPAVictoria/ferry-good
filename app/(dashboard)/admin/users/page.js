import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminUsersClient from './admin-users-client'

export const metadata = {
  title: 'Users — Ferry Good',
}

export default async function AdminUsersPage() {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/schedules')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">Register and manage system accounts</p>
      </div>
      <AdminUsersClient />
    </div>
  )
}
