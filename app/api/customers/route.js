import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const noContact = searchParams.get('noContact') === 'true'

  // DISTINCT customer names, NULL check for contact
  const customers = await prisma.$queryRaw`
    SELECT DISTINCT ON (c.id)
      c.id,
      c."fullName",
      c.contact,
      c."createdAt",
      u.name AS created_by_name
    FROM "Customer" c
    INNER JOIN "User" u ON u.id = c."createdById"
    WHERE
      (${search} = '' OR c."fullName" ILIKE ${'%' + search + '%'})
      AND (${noContact}::boolean = false OR c.contact IS NULL)
    ORDER BY c.id, c."fullName" ASC
  `

  return NextResponse.json(customers)
}

export async function POST(request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  if (role !== 'ADMIN' && role !== 'REGISTER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { fullName, contact } = body

  if (!fullName?.trim()) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
  }

  const customer = await prisma.customer.create({
    data: {
      fullName: fullName.trim(),
      contact: contact?.trim() || null,
      createdById: parseInt(session.user.id),
    },
  })

  return NextResponse.json(customer, { status: 201 })
}
