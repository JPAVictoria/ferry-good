import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt((await params).id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  // Raw SQL with INNER JOIN: assignments + customers + users
  const assignments = await prisma.$queryRaw`
    SELECT
      a.id             AS assignment_id,
      a."assignedAt"   AS assigned_at,
      c.id             AS customer_id,
      c."fullName"     AS customer_name,
      c.contact        AS customer_contact,
      u.id             AS assigned_by_id,
      u.name           AS assigned_by_name
    FROM "Assignment" a
    INNER JOIN "Customer" c ON c.id = a."customerId"
    INNER JOIN "User" u ON u.id = a."assignedById"
    WHERE a."scheduleId" = ${id}
    ORDER BY a."assignedAt" ASC
  `

  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { _count: { select: { assignments: true } } },
  })

  if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ schedule, assignments })
}

export async function PATCH(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = parseInt((await params).id)
  const body = await request.json()
  const { status } = body

  const schedule = await prisma.schedule.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(schedule)
}

export async function DELETE(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = parseInt((await params).id)

  await prisma.schedule.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
