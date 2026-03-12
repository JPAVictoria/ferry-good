import { auth } from '@/lib/auth'
import { getHistoryData, getHistorySummary } from '@/lib/db/history'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  if (role !== 'ADMIN' && role !== 'REGISTER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''

  const statuses = status
    ? status.split(',').filter(s => ['OPEN', 'FULL', 'CANCELLED'].includes(s))
    : []

  const [historyData, summary] = await Promise.all([
    getHistoryData({ startDate, endDate, statuses, search }),
    getHistorySummary(),
  ])

  return NextResponse.json({ historyData, summary })
}
