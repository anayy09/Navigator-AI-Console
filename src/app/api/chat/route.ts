import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkAndIncrementUsage } from '@/lib/usage'
import { handleApiError, AppError } from '@/lib/error-handler'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { messages, model } = body

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new AppError('Messages array is required and cannot be empty', 400)
    }

    if (messages.some(msg => !msg.role || !msg.content)) {
      throw new AppError('Each message must have role and content', 400)
    }

    // Check usage limits
    const userId = session?.user?.id
    const { allowed, remaining } = await checkAndIncrementUsage(userId)

    if (!allowed) {
      throw new AppError('Daily quota exhausted. Try again tomorrow.', 429, 'QUOTA_EXCEEDED')
    }

    // Validate model
    const validModels = [
      'llama-3.1-70b-instruct', 'llama-3.3-70b-instruct', 'mixtral-8x7b-instruct',
      'llama-3.1-8b-instruct', 'mistral-7b-instruct', 'mistral-small-3.1',
      'codestral-22b', 'granite-3.1-8b-instruct', 'gemma-3-27b-it', 'kokoro'
    ]

    const selectedModel = model || 'llama-3.1-70b-instruct'
    if (!validModels.includes(selectedModel)) {
      throw new AppError(`Invalid model: ${selectedModel}`, 400, 'INVALID_MODEL')
    }

    // Make request to LiteLLM with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
      const stream = await client.chat.completions.create({
        model: selectedModel,
        messages: messages.slice(-10), // Limit context to last 10 messages
        stream: true,
        max_tokens: 2000,
        temperature: 0.7,
        ...(userId && { user: userId }),
      }, {
        signal: controller.signal as any
      })

      clearTimeout(timeoutId)

      // Create readable stream
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          } catch (error) {
            console.error('Stream error:', error)
            controller.error(error)
          } finally {
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })

    } catch (streamError) {
      clearTimeout(timeoutId)
      throw streamError
    }

  } catch (error: any) {
    return handleApiError(error)
  }
}