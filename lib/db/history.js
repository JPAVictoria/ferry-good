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
      c."fullName"      AS customer_name,
      c.contact         AS contact,
      c."createdAt"     AS customer_created_at,
      s.id              AS schedule_id,
      s."ferryDate"     AS ferry_date,
      s."ferryTime"     AS ferry_time,
      s.status          AS schedule_status,
      s."maxCapacity"   AS max_capacity,
      u_assign.name     AS assigned_by,
      a."assignedAt"    AS assigned_at,
      u_create.name     AS created_by
    FROM "Customer" c
    LEFT JOIN "Assignment" a ON a."customerId" = c.id
    LEFT JOIN "Schedule" s ON s.id = a."scheduleId"
      AND s.status::text = ANY(${statusList}::text[])
      AND s."ferryDate" BETWEEN ${start} AND ${end}
    LEFT JOIN "User" u_assign ON u_assign.id = a."assignedById"
    INNER JOIN "User" u_create ON u_create.id = c."createdById"
    WHERE c."fullName" ILIKE ${searchTerm}
    ORDER BY a."assignedAt" DESC NULLS LAST, c."fullName" ASC
  `

  return result
}

/**
 * Summary stats using subqueries and aggregation
 */
export async function getHistorySummary() {
  // Customers with more than 1 booking (subquery / HAVING pattern)
  const frequentCustomers = await prisma.$queryRaw`
    SELECT c.id, c."fullName", COUNT(a.id) AS booking_count
    FROM "Customer" c
    INNER JOIN "Assignment" a ON a."customerId" = c.id
    GROUP BY c.id, c."fullName"
    HAVING COUNT(a.id) > 1
    ORDER BY booking_count DESC
  `

  // RIGHT JOIN: all schedules even if no customers assigned
  const schedulesWithCounts = await prisma.$queryRaw`
    SELECT s.id, s."ferryDate", s."ferryTime", s.status, s."maxCapacity",
           COUNT(a.id)::int AS assignment_count
    FROM "Assignment" a
    RIGHT JOIN "Schedule" s ON s.id = a."scheduleId"
    GROUP BY s.id
    ORDER BY s."ferryDate" DESC
  `

  // UNION: active (OPEN/FULL) schedules UNION cancelled schedules
  const scheduleUnion = await prisma.$queryRaw`
    SELECT id, "ferryDate", "ferryTime", status, "maxCapacity" FROM "Schedule"
    WHERE status::text IN ('OPEN', 'FULL')
    UNION
    SELECT id, "ferryDate", "ferryTime", status, "maxCapacity" FROM "Schedule"
    WHERE status::text = 'CANCELLED'
    ORDER BY "ferryDate" DESC
  `

  // Customers with no contact info (NULL check)
  const noContactCustomers = await prisma.$queryRaw`
    SELECT id, "fullName" FROM "Customer"
    WHERE contact IS NULL
    ORDER BY "fullName"
  `

  return { frequentCustomers, schedulesWithCounts, scheduleUnion, noContactCustomers }
}

/**
 * Customers in multiple schedules (INTERSECT workaround using IN + subquery)
 */
export async function getCustomersInMultipleSchedules(scheduleId1, scheduleId2) {
  return await prisma.$queryRaw`
    SELECT c.id, c."fullName"
    FROM "Customer" c
    WHERE c.id IN (SELECT "customerId" FROM "Assignment" WHERE "scheduleId" = ${scheduleId1})
      AND c.id IN (SELECT "customerId" FROM "Assignment" WHERE "scheduleId" = ${scheduleId2})
    ORDER BY c."fullName"
  `
}

/**
 * Customers NOT in a specific schedule (EXCEPT workaround using NOT IN)
 */
export async function getCustomersNotInSchedule(scheduleId) {
  return await prisma.$queryRaw`
    SELECT c.id, c."fullName", c.contact
    FROM "Customer" c
    WHERE c.id NOT IN (
      SELECT "customerId" FROM "Assignment" WHERE "scheduleId" = ${scheduleId}
    )
    ORDER BY c."fullName"
  `
}
