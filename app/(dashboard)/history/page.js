import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import HistoryClient from './history-client'

export const metadata = {
  title: 'History — Ferry Good',
}

export default async function HistoryPage() {
  const session = await auth()

  if (!session || !['ADMIN', 'REGISTER'].includes(session.user.role)) {
    redirect('/schedules')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Booking History</h1>
        <p className="text-slate-500 text-sm mt-1">Full audit of all customer assignments and schedules</p>
      </div>
      <HistoryClient />
    </div>
  )
}
