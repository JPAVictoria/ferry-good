import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // comma-separated
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const statusList = status
    ? status.split(',').filter(s => ['OPEN', 'FULL', 'CANCELLED'].includes(s))
    : ['OPEN', 'FULL', 'CANCELLED']

  const start = dateFrom ? new Date(dateFrom) : new Date('2000-01-01')
  const end = dateTo ? new Date(dateTo) : new Date('2099-12-31')

  // Raw SQL: status IN filter + BETWEEN date range
  const schedules = await prisma.$queryRaw`
    SELECT
      s.id,
      s."ferryDate"    AS ferry_date,
      s."ferryTime"    AS ferry_time,
      s."maxCapacity"  AS max_capacity,
      s.status,
      s."createdAt"    AS created_at,
      COUNT(a.id)::int AS assignment_count
    FROM "Schedule" s
    LEFT JOIN "Assignment" a ON a."scheduleId" = s.id
    WHERE s.status::text = ANY(${statusList}::text[])
      AND s."ferryDate" BETWEEN ${start} AND ${end}
    GROUP BY s.id
    ORDER BY s."ferryDate" ASC, s."ferryTime" ASC
  `

  return NextResponse.json(schedules)
}

export async function POST(request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { ferryDate, ferryTime, maxCapacity } = body

  if (!ferryDate || !ferryTime || !maxCapacity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const schedule = await prisma.schedule.create({
    data: {
      ferryDate: new Date(ferryDate),
      ferryTime,
      maxCapacity: parseInt(maxCapacity),
    },
  })

  return NextResponse.json(schedule, { status: 201 })
}
