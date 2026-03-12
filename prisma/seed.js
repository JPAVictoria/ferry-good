import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcryptjs'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create users
  const adminHash = await bcrypt.hash('admin123', 12)
  const registerHash = await bcrypt.hash('register123', 12)
  const clientHash = await bcrypt.hash('client123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ferrygood.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ferrygood.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  const register = await prisma.user.upsert({
    where: { email: 'register@ferrygood.com' },
    update: {},
    create: {
      name: 'Register Staff',
      email: 'register@ferrygood.com',
      passwordHash: registerHash,
      role: 'REGISTER',
    },
  })

  const client = await prisma.user.upsert({
    where: { email: 'client@ferrygood.com' },
    update: {},
    create: {
      name: 'Client User',
      email: 'client@ferrygood.com',
      passwordHash: clientHash,
      role: 'CLIENT',
    },
  })

  console.log('Users created:', admin.email, register.email, client.email)

  // Create sample schedules
  const today = new Date()
  const scheduleDates = [0, 1, 2, 3, 5, 7].map((offset) => {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    date.setHours(0, 0, 0, 0)
    return date
  })

  const schedules = []
  for (let i = 0; i < scheduleDates.length; i++) {
    const schedule = await prisma.schedule.create({
      data: {
        ferryDate: scheduleDates[i],
        ferryTime: i % 2 === 0 ? '08:00' : '14:00',
        maxCapacity: 5,
        status: i === 4 ? 'CANCELLED' : 'OPEN',
      },
    })
    schedules.push(schedule)
  }

  console.log('Schedules created:', schedules.length)

  // Create sample customers
  const customerData = [
    { fullName: 'Maria Santos', contact: '09171234567' },
    { fullName: 'Juan dela Cruz', contact: '09281234567' },
    { fullName: 'Ana Reyes', contact: null },
    { fullName: 'Pedro Gomez', contact: '09391234567' },
    { fullName: 'Rosa Garcia', contact: null },
    { fullName: 'Carlos Ramos', contact: '09451234567' },
  ]

  const createdCustomers = []
  for (const c of customerData) {
    const customer = await prisma.customer.create({
      data: { ...c, createdById: admin.id },
    })
    createdCustomers.push(customer)
  }

  console.log('Customers created:', createdCustomers.length)

  // Assign customers to schedule 0
  for (let i = 0; i < 3 && i < createdCustomers.length; i++) {
    await prisma.assignment.create({
      data: {
        customerId: createdCustomers[i].id,
        scheduleId: schedules[0].id,
        assignedById: admin.id,
      },
    })
  }

  // Assign some to schedule 1 as well
  for (let i = 0; i < 2 && i < createdCustomers.length; i++) {
    await prisma.assignment.create({
      data: {
        customerId: createdCustomers[i].id,
        scheduleId: schedules[1].id,
        assignedById: register.id,
      },
    })
  }

  console.log('Assignments created')

  console.log('\n=== Seed complete ===')
  console.log('Login credentials:')
  console.log('  ADMIN:    admin@ferrygood.com / admin123')
  console.log('  REGISTER: register@ferrygood.com / register123')
  console.log('  CLIENT:   client@ferrygood.com / client123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
