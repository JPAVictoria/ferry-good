import { auth } from '@/lib/auth'
import SchedulesClient from './schedules-client'

export const metadata = {
  title: 'Schedules — Ferry Good',
}

export default async function SchedulesPage() {
  const session = await auth()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Ferry Schedules</h1>
        <p className="text-slate-500 text-sm mt-1">Manage and view all ferry schedules</p>
      </div>
      <SchedulesClient role={session.user.role} />
    </div>
  )
}
