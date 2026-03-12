import prisma from '@/lib/prisma'

/**
 * Master history query using advanced SQL patterns:
 * - LEFT JOIN (customers without assignments)
 * - INNER JOIN (assignments with customers and schedules)
 * - DISTINCT customers
 * - BETWEEN date ranges
 * - IN (schedule status filter)
 * - NULL check (contact IS NULL)
 * - Subquery (customers with >1 booking)
 * - UNION (active + cancelled schedules)
 * - NOT IN / IN workarounds for EXCEPT / INTERSECT
 */
export async function getHistoryData({ startDate, endDate, statuses, search } = {}) {
  const statusList = statuses?.length
    ? statuses
    : ['OPEN', 'FULL', 'CANCELLED']

  const start = startDate ? new Date(startDate) : new Date('2000-01-01')
  const end = endDate ? new Date(endDate) : new Date('2099-12-31')
  const searchTerm = search ? `%${search}%` : '%'

  // Main LEFT JOIN query: all customers and their schedule assignments
  // Uses: DISTINCT, LEFT JOIN, INNER JOIN, BETWEEN, ANY (IN equivalent), ILIKE
  const result = await prisma.$queryRaw`
    SELECT DISTINCT
      c.id              AS customer_id,
      c.full_name       AS customer_name,
      c.contact         AS contact,
      c.created_at      AS customer_created_at,
      s.id              AS schedule_id,
      s.ferry_date      AS ferry_date,
      s.ferry_time      AS ferry_time,
      s.status          AS schedule_status,
      s.max_capacity    AS max_capacity,
      u_assign.name     AS assigned_by,
      a.assigned_at     AS assigned_at,
      u_create.name     AS created_by
    FROM "Customer" c
    LEFT JOIN "Assignment" a ON a.customer_id = c.id
    LEFT JOIN "Schedule" s ON s.id = a.schedule_id
      AND s.status = ANY(${statusList}::text[])
      AND s.ferry_date BETWEEN ${start} AND ${end}
    LEFT JOIN "User" u_assign ON u_assign.id = a.assigned_by_id
    INNER JOIN "User" u_create ON u_create.id = c.created_by_id
    WHERE c.full_name ILIKE ${searchTerm}
    ORDER BY a.assigned_at DESC NULLS LAST, c.full_name ASC
  `

  return result
}

/**
 * Summary stats using subqueries and aggregation
 */
export async function getHistorySummary() {
  // Customers with more than 1 booking (subquery / HAVING pattern)
  const frequentCustomers = await prisma.$queryRaw`
    SELECT c.id, c.full_name, COUNT(a.id) AS booking_count
    FROM "Customer" c
    INNER JOIN "Assignment" a ON a.customer_id = c.id
    GROUP BY c.id, c.full_name
    HAVING COUNT(a.id) > 1
    ORDER BY booking_count DESC
  `

  // RIGHT JOIN: all schedules even if no customers assigned
  const schedulesWithCounts = await prisma.$queryRaw`
    SELECT s.id, s.ferry_date, s.ferry_time, s.status, s.max_capacity,
           COUNT(a.id)::int AS assignment_count
    FROM "Assignment" a
    RIGHT JOIN "Schedule" s ON s.id = a.schedule_id
    GROUP BY s.id
    ORDER BY s.ferry_date DESC
  `

  // UNION: active (OPEN/FULL) schedules UNION cancelled schedules
  const scheduleUnion = await prisma.$queryRaw`
    SELECT id, ferry_date, ferry_time, status, max_capacity FROM "Schedule"
    WHERE status IN ('OPEN', 'FULL')
    UNION
    SELECT id, ferry_date, ferry_time, status, max_capacity FROM "Schedule"
    WHERE status = 'CANCELLED'
    ORDER BY ferry_date DESC
  `

  // Customers with no contact info (NULL check)
  const noContactCustomers = await prisma.$queryRaw`
    SELECT id, full_name FROM "Customer"
    WHERE contact IS NULL
    ORDER BY full_name
  `

  return { frequentCustomers, schedulesWithCounts, scheduleUnion, noContactCustomers }
}

/**
 * Customers in multiple schedules (INTERSECT workaround using IN + subquery)
 */
export async function getCustomersInMultipleSchedules(scheduleId1, scheduleId2) {
  return await prisma.$queryRaw`
    SELECT c.id, c.full_name
    FROM "Customer" c
    WHERE c.id IN (SELECT customer_id FROM "Assignment" WHERE schedule_id = ${scheduleId1})
      AND c.id IN (SELECT customer_id FROM "Assignment" WHERE schedule_id = ${scheduleId2})
    ORDER BY c.full_name
  `
}

/**
 * Customers NOT in a specific schedule (EXCEPT workaround using NOT IN)
 */
export async function getCustomersNotInSchedule(scheduleId) {
  return await prisma.$queryRaw`
    SELECT c.id, c.full_name, c.contact
    FROM "Customer" c
    WHERE c.id NOT IN (
      SELECT customer_id FROM "Assignment" WHERE schedule_id = ${scheduleId}
    )
    ORDER BY c.full_name
  `
}
