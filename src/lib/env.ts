import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  LLM_BASE_URL: z.string().url('LLM_BASE_URL must be a valid URL'),
  LLM_API_KEY: z.string().min(1, 'LLM_API_KEY is required'),
  ANON_TOKEN_SECRET: z.string().min(1, 'ANON_TOKEN_SECRET is required'),
})

export const env = envSchema.parse(process.env)

// Validate environment on startup
export function validateEnvironment() {
  try {
    envSchema.parse(process.env)
    console.log('✅ Environment variables validated')
  } catch (error) {
    console.error('❌ Environment validation failed:', error)
    if (error instanceof z.ZodError) {
      console.error('Missing or invalid environment variables:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}