import prisma from '@/lib/prisma'

/**
 * Transaction: assign a customer to a schedule.
 * Checks capacity and updates schedule status to FULL if needed.
 */
export async function createAssignment({ customerId, scheduleId, assignedById }) {
  return await prisma.$transaction(async (tx) => {
    // Get schedule with current assignment count
    const schedule = await tx.schedule.findUnique({
      where: { id: scheduleId },
      include: { _count: { select: { assignments: true } } },
    })

    if (!schedule) throw new Error('Schedule not found')
    if (schedule.status === 'CANCELLED') throw new Error('Cannot assign to a cancelled schedule')
    if (schedule.status === 'FULL') throw new Error('Schedule is already full')

    const currentCount = schedule._count.assignments

    // Create the assignment
    const assignment = await tx.assignment.create({
      data: {
        customerId,
        scheduleId,
        assignedById,
      },
    })

    // Auto-update status to FULL if at capacity
    if (currentCount + 1 >= schedule.maxCapacity) {
      await tx.schedule.update({
        where: { id: scheduleId },
        data: { status: 'FULL' },
      })
    }

    return assignment
  })
}

/**
 * Transaction: remove an assignment and re-open schedule if it was FULL.
 */
export async function deleteAssignment(assignmentId) {
  return await prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.findUnique({
      where: { id: assignmentId },
      include: { schedule: true },
    })

    if (!assignment) throw new Error('Assignment not found')

    await tx.assignment.delete({ where: { id: assignmentId } })

    // If schedule was FULL, revert to OPEN
    if (assignment.schedule.status === 'FULL') {
      await tx.schedule.update({
        where: { id: assignment.scheduleId },
        data: { status: 'OPEN' },
      })
    }

    return { success: true }
  })
}
