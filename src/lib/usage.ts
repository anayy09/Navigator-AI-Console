import { prisma } from './prisma'
import { redis } from './redis'
import { getOrCreateAnonToken } from './anon-token'

export async function checkAndIncrementUsage(userId?: string): Promise<{ allowed: boolean; remaining: number }> {
  if (userId) {
    // Authenticated user - check database
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const usageLog = await prisma.usageLog.upsert({
      where: {
        userId_day: {
          userId,
          day: today
        }
      },
      update: {
        hits: {
          increment: 1
        }
      },
      create: {
        userId,
        day: today,
        hits: 1
      }
    })

    const allowed = usageLog.hits <= 10
    const remaining = Math.max(0, 10 - usageLog.hits)

    return { allowed, remaining }
  } else {
    // Anonymous user - check Redis
    const anonToken = await getOrCreateAnonToken()
    const key = `anon:${anonToken}`
    
    const current = await redis.get(key)
    const currentCount = current ? parseInt(current) : 0
    
    if (currentCount >= 2) {
      return { allowed: false, remaining: 0 }
    }

    await redis.multi()
      .incr(key)
      .expire(key, 24 * 60 * 60) // 24 hours
      .exec()

    return { allowed: true, remaining: Math.max(0, 2 - (currentCount + 1)) }
  }
}

export async function getUserUsage(userId?: string): Promise<{ used: number; limit: number }> {
  if (userId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const usageLog = await prisma.usageLog.findUnique({
      where: {
        userId_day: {
          userId,
          day: today
        }
      }
    })

    return { used: usageLog?.hits || 0, limit: 10 }
  } else {
    const anonToken = await getOrCreateAnonToken()
    const key = `anon:${anonToken}`
    const current = await redis.get(key)
    const used = current ? parseInt(current) : 0

    return { used, limit: 2 }
  }
}