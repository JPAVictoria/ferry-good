import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'

export default async function DashboardLayout({ children }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={session.user} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
