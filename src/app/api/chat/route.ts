import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { checkAndIncrementUsage } from '@/lib/usage'
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

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Check usage limits
    const userId = session?.user?.id
    const { allowed, remaining } = await checkAndIncrementUsage(userId)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Daily quota exhausted. Try again tomorrow.' },
        { status: 429 }
      )
    }

    // Make request to LiteLLM
    const stream = await client.chat.completions.create({
      model: model || 'llama-3.1-70b-instruct',
      messages,
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
      ...(userId && { user: userId }), // Include user ID for LiteLLM budgeting
    })

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
      },
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    
    // Handle LiteLLM budget errors
    if (error.status === 401 || error.status === 429) {
      return NextResponse.json(
        { error: error.message || 'Budget limit exceeded' },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}