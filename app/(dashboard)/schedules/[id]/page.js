import { auth } from '@/lib/auth'
import ScheduleDetailClient from './schedule-detail-client'

export const metadata = {
  title: 'Schedule Details — Ferry Good',
}

export default async function ScheduleDetailPage({ params }) {
  const session = await auth()
  const { id } = await params

  return (
    <ScheduleDetailClient scheduleId={parseInt(id)} role={session.user.role} />
  )
}
