import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean up existing data
  await prisma.usageLog.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Database cleaned')

  // Create a test user (optional)
  const testUser = await prisma.user.create({
    data: {
      email: 'test@navigator.ai',
      name: 'Test User',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Test user created:', testUser.email)

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })