import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt((await params).id)
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      assignments: {
        include: {
          schedule: true,
          assignedBy: { select: { name: true } },
        },
      },
    },
  })

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

export async function DELETE(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = parseInt((await params).id)

  // Transaction: cascade delete assignments then customer
  await prisma.$transaction(async (tx) => {
    await tx.assignment.deleteMany({ where: { customerId: id } })
    await tx.customer.delete({ where: { id } })
  })

  return NextResponse.json({ success: true })
}
