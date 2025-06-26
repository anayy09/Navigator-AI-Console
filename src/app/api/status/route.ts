import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
})

export async function GET() {
  const status = {
    timestamp: new Date().toISOString(),
    services: {
      api: { status: 'ok', latency: 0 },
      database: { status: 'unknown', latency: 0 },
      redis: { status: 'unknown', latency: 0 },
      llm_gateway: { status: 'unknown', latency: 0 },
    },
    overall: 'unknown' as 'ok' | 'degraded' | 'down'
  }

  // Check database
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    status.services.database = {
      status: 'ok',
      latency: Date.now() - dbStart
    }
  } catch (error) {
    status.services.database = { status: 'down', latency: 0 }
  }

  // Check Redis
  try {
    const redisStart = Date.now()
    await redis.ping()
    status.services.redis = {
      status: 'ok',
      latency: Date.now() - redisStart
    }
  } catch (error) {
    status.services.redis = { status: 'down', latency: 0 }
  }

  // Check LLM Gateway
  try {
    const llmStart = Date.now()
    await fetch(`${process.env.LLM_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${process.env.LLM_API_KEY}` }
    })
    status.services.llm_gateway = {
      status: 'ok',
      latency: Date.now() - llmStart
    }
  } catch (error) {
    status.services.llm_gateway = { status: 'down', latency: 0 }
  }

  // Determine overall status
  const services = Object.values(status.services)
  const downServices = services.filter(s => s.status === 'down').length
  
  if (downServices === 0) {
    status.overall = 'ok'
  } else if (downServices === services.length) {
    status.overall = 'down'
  } else {
    status.overall = 'degraded'
  }

  const httpStatus = status.overall === 'ok' ? 200 : 
                    status.overall === 'degraded' ? 207 : 503

  return NextResponse.json(status, { status: httpStatus })
}