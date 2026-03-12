import { auth } from '@/lib/auth'
import { createAssignment, deleteAssignment } from '@/lib/db/assignments'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  if (role !== 'ADMIN' && role !== 'REGISTER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { customerId, scheduleId } = body

  if (!customerId || !scheduleId) {
    return NextResponse.json({ error: 'customerId and scheduleId are required' }, { status: 400 })
  }

  try {
    const assignment = await createAssignment({
      customerId: parseInt(customerId),
      scheduleId: parseInt(scheduleId),
      assignedById: parseInt(session.user.id),
    })
    return NextResponse.json(assignment, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 422 })
  }
}

export async function DELETE(request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = parseInt(searchParams.get('id'))

  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    await deleteAssignment(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 422 })
  }
}
