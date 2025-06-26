import Redis from 'ioredis'
import { kv } from '@vercel/kv'

// Use Vercel KV in production, local Redis in development
const redis = process.env.VERCEL 
  ? {
      get: async (key: string) => await kv.get(key),
      set: async (key: string, value: string, ttl?: number) => 
        ttl ? await kv.setex(key, ttl, value) : await kv.set(key, value),
      del: async (key: string) => await kv.del(key),
      incr: async (key: string) => await kv.incr(key),
      expire: async (key: string, seconds: number) => await kv.expire(key, seconds),
    }
  : new Redis(process.env.REDIS_URL!)

export { redis }